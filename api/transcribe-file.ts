import type { VercelRequest, VercelResponse } from "@vercel/node";
import fs from "fs";
import FormData from "form-data";
import fetch from "node-fetch";

interface AssemblyAIUploadResponse {
  upload_url: string;
}

interface AssemblyAITranscriptResponse {
  id: string;
  status: string;
  text?: string;
  error?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const file = req.body.file; // Vercel parses body differently if not using FormData parsing. Use `req.body` only if file is properly sent.
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const form = new FormData();
    form.append("file", file, { filename: "lecture" });

    const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: { authorization: process.env.ASSEMBLYAI_API_KEY! },
      body: form,
    });

    const uploadData = (await uploadRes.json()) as AssemblyAIUploadResponse;

    // Start transcription
    const transcriptRes = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        authorization: process.env.ASSEMBLYAI_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ audio_url: uploadData.upload_url }),
    });

    const transcriptData = (await transcriptRes.json()) as AssemblyAITranscriptResponse;
    res.status(200).json(transcriptData);
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
}
