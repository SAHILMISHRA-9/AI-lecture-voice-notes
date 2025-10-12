import type { VercelRequest, VercelResponse } from "@vercel/node";
import FormData from "form-data";
import fetch from "node-fetch";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const file = req.body?.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const form = new FormData();
    form.append("file", file, "lecture.m4a");

    const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: { authorization: process.env.ASSEMBLYAI_API_KEY! },
      body: form,
    });

    const uploadData = (await uploadRes.json()) as { upload_url: string };

    // Start transcription
    const transcriptRes = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        authorization: process.env.ASSEMBLYAI_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ audio_url: uploadData.upload_url }),
    });

    const transcriptData = await transcriptRes.json();

    // Poll until transcription is complete
    let transcriptText = "";
    while (true) {
      const statusRes = await fetch(
        `https://api.assemblyai.com/v2/transcript/${transcriptData.id}`,
        { headers: { authorization: process.env.ASSEMBLYAI_API_KEY! } }
      );
      const status = (await statusRes.json()) as { status: string; text?: string; error?: string };
      if (status.status === "completed") {
        transcriptText = status.text || "";
        break;
      }
      if (status.status === "error") throw new Error(status.error || "Transcription failed");
      await new Promise((r) => setTimeout(r, 2000));
    }

    res.status(200).json({ text: transcriptText });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
