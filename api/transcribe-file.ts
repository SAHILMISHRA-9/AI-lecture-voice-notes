import type { VercelRequest, VercelResponse } from "@vercel/node";
import fs from "fs";
import FormData from "form-data";
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
    const file = req.body.file;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const form = new FormData();
    form.append("file", file, { filename: "lecture" });

    const r = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: {
        authorization: process.env.ASSEMBLYAI_API_KEY!,
      },
      body: form,
    });

    const uploadData = await r.json() as { upload_url: string };

    const t = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        authorization: process.env.ASSEMBLYAI_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ audio_url: uploadData.upload_url }),
    });

    const transcriptData = (await t.json()) as AssemblyAITranscript;

    if (transcriptData.status === "error") {
      return res.status(500).json({ error: transcriptData.error || "Transcription failed" });
    }

    res.status(200).json(transcriptData);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
