import type { VercelRequest, VercelResponse } from "@vercel/node";
import fetch from "node-fetch";

type AssemblyAITranscript = {
  id: string;
  status: "queued" | "processing" | "completed" | "error";
  text?: string;
  error?: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "No YouTube URL provided" });

    const r = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        authorization: process.env.ASSEMBLYAI_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ audio_url: url }),
    });

    const transcriptData = (await r.json()) as AssemblyAITranscript;

    if (transcriptData.status === "error") {
      return res.status(500).json({ error: transcriptData.error || "Transcription failed" });
    }

    res.status(200).json(transcriptData);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
