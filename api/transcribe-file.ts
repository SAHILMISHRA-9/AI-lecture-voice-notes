import type { VercelRequest, VercelResponse } from "@vercel/node";
import fs from "fs";
import FormData from "form-data";
import fetch from "node-fetch";

interface AssemblyAITranscript {
  id: string;
  status: string;
  text?: string;
  error?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const file = req.body.file; // assume FormData upload
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const form = new FormData();
    form.append("file", file, { filename: "lecture" });

    const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: {
        authorization: process.env.ASSEMBLYAI_API_KEY!,
      },
      body: form,
    });

    const uploadData = await uploadRes.json() as { upload_url: string };

    const transcriptRes = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        authorization: process.env.ASSEMBLYAI_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ audio_url: uploadData.upload_url }),
    });

    const transcript: AssemblyAITranscript = await transcriptRes.json() as AssemblyAITranscript;

    if (transcript.error) {
      return res.status(500).json({ error: transcript.error });
    }

    res.status(200).json(transcript);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
