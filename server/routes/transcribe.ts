import type { RequestHandler } from "express";

const ASSEMBLYAI_URL = "https://api.assemblyai.com/v2";

async function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function transcribeWithAssemblyAIFromUpload(bytes: Uint8Array, filename: string): Promise<string> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) throw new Error("ASSEMBLYAI_API_KEY is not set");
  const uploadRes = await fetch(`${ASSEMBLYAI_URL}/upload`, {
    method: "POST",
    headers: { Authorization: apiKey },
    body: bytes,
  });
  if (!uploadRes.ok) throw new Error(`AssemblyAI upload failed: ${uploadRes.status}`);
  const uploadData = await uploadRes.json() as { upload_url: string };
  const createRes = await fetch(`${ASSEMBLYAI_URL}/transcript`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: apiKey },
    body: JSON.stringify({ audio_url: uploadData.upload_url, speaker_labels: false, punctuate: true, format_text: true })
  });
  if (!createRes.ok) throw new Error(`AssemblyAI create transcript failed: ${createRes.status}`);
  const createData = await createRes.json() as { id: string };
  for (let i = 0; i < 60; i++) {
    await sleep(2000);
    const poll = await fetch(`${ASSEMBLYAI_URL}/transcript/${createData.id}`, { headers: { Authorization: apiKey } });
    const j = await poll.json() as any;
    if (j.status === "completed") return String(j.text || "");
    if (j.status === "error") throw new Error(j.error || "AssemblyAI error");
  }
  throw new Error("AssemblyAI polling timed out");
}

async function transcribeWithAssemblyAIFromUrl(url: string): Promise<string> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) throw new Error("ASSEMBLYAI_API_KEY is not set");
  const createRes = await fetch(`${ASSEMBLYAI_URL}/transcript`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: apiKey },
    body: JSON.stringify({ audio_url: url, speaker_labels: false, punctuate: true, format_text: true })
  });
  if (!createRes.ok) throw new Error(`AssemblyAI create transcript failed: ${createRes.status}`);
  const createData = await createRes.json() as { id: string };
  for (let i = 0; i < 60; i++) {
    await sleep(2000);
    const poll = await fetch(`${ASSEMBLYAI_URL}/transcript/${createData.id}`, { headers: { Authorization: apiKey } });
    const j = await poll.json() as any;
    if (j.status === "completed") return String(j.text || "");
    if (j.status === "error") throw new Error(j.error || "AssemblyAI error");
  }
  throw new Error("AssemblyAI polling timed out");
}

async function transcribeWithOpenAI(bytes: Uint8Array, filename: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  const form = new FormData();
  // @ts-ignore
  form.append("file", new Blob([bytes], { type: "audio/mpeg" }), filename || "audio.mp3");
  form.append("model", "gpt-4o-mini-transcribe");
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form as any,
  });
  if (!res.ok) throw new Error(`OpenAI transcribe failed: ${res.status}`);
  const j = await res.json() as { text?: string };
  return j.text || "";
}

// Background job: start from file (AssemblyAI only)
export const handleStartTranscribeFile: RequestHandler = async (req, res) => {
  try {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      res.status(400).json({ error: "ASSEMBLYAI_API_KEY is not set" });
      return;
    }
    const chunks: Uint8Array[] = [];
    req.on("data", (d) => chunks.push(d));
    await new Promise<void>((resolve) => req.on("end", () => resolve()));
    const bytes = new Uint8Array(Buffer.concat(chunks as any));

    const uploadRes = await fetch(`${ASSEMBLYAI_URL}/upload`, { method: "POST", headers: { Authorization: apiKey }, body: bytes });
    if (!uploadRes.ok) {
      res.status(500).json({ error: `AssemblyAI upload failed: ${uploadRes.status}` });
      return;
    }
    const uploadData = await uploadRes.json() as { upload_url: string };
    const createRes = await fetch(`${ASSEMBLYAI_URL}/transcript`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: apiKey },
      body: JSON.stringify({ audio_url: uploadData.upload_url, speaker_labels: false, punctuate: true, format_text: true })
    });
    if (!createRes.ok) {
      res.status(500).json({ error: `AssemblyAI create transcript failed: ${createRes.status}` });
      return;
    }
    const createData = await createRes.json() as { id: string };
    res.json({ id: createData.id });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Start transcription failed" });
  }
};

// Background job: start from YouTube/remote URL (AssemblyAI only)
export const handleStartTranscribeYouTube: RequestHandler = async (req, res) => {
  try {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    const { url } = req.body || {};
    if (!url || typeof url !== "string") {
      res.status(400).json({ error: "Missing YouTube URL" });
      return;
    }
    if (!apiKey) {
      res.status(400).json({ error: "ASSEMBLYAI_API_KEY is not set" });
      return;
    }
    const createRes = await fetch(`${ASSEMBLYAI_URL}/transcript`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: apiKey },
      body: JSON.stringify({ audio_url: url, speaker_labels: false, punctuate: true, format_text: true })
    });
    if (!createRes.ok) {
      res.status(500).json({ error: `AssemblyAI create transcript failed: ${createRes.status}` });
      return;
    }
    const createData = await createRes.json() as { id: string };
    res.json({ id: createData.id });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Start YouTube transcription failed" });
  }
};

// Background job: status lookup (AssemblyAI only)
export const handleTranscribeStatus: RequestHandler = async (req, res) => {
  try {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    const id = String(req.params.id || "");
    if (!apiKey) {
      res.status(400).json({ error: "ASSEMBLYAI_API_KEY is not set" });
      return;
    }
    if (!id) {
      res.status(400).json({ error: "Missing transcription id" });
      return;
    }
    const poll = await fetch(`${ASSEMBLYAI_URL}/transcript/${id}`, { headers: { Authorization: apiKey } });
    if (!poll.ok) {
      res.status(500).json({ error: `AssemblyAI status failed: ${poll.status}` });
      return;
    }
    const j = await poll.json() as any;
    const out: any = { status: j.status };
    if (j.status === "completed") out.text = j.text || "";
    if (j.status === "error") out.error = j.error || "Unknown error";
    res.json(out);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Status check failed" });
  }
};

export const handleTranscribeFile: RequestHandler = async (req, res) => {
  try {
    const chunks: Uint8Array[] = [];
    req.on("data", (d) => chunks.push(d));
    await new Promise<void>((resolve) => req.on("end", () => resolve()));
    const bytes = new Uint8Array(Buffer.concat(chunks as any));
    const filename = String(req.header("x-filename") || "upload.bin");

    let text = "";
    if (process.env.ASSEMBLYAI_API_KEY) {
      text = await transcribeWithAssemblyAIFromUpload(bytes, filename);
    } else if (process.env.OPENAI_API_KEY) {
      text = await transcribeWithOpenAI(bytes, filename);
    } else {
      res.status(400).json({ error: "No transcription provider configured. Set ASSEMBLYAI_API_KEY or OPENAI_API_KEY." });
      return;
    }

    res.json({ text });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Transcription failed" });
  }
};

export const handleTranscribeYouTube: RequestHandler = async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url || typeof url !== "string") {
      res.status(400).json({ error: "Missing YouTube URL" });
      return;
    }

    if (!process.env.ASSEMBLYAI_API_KEY) {
      res.status(400).json({ error: "YouTube transcription requires ASSEMBLYAI_API_KEY (remote URL support)." });
      return;
    }

    const text = await transcribeWithAssemblyAIFromUrl(url);
    res.json({ text });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "YouTube transcription failed" });
  }
};
