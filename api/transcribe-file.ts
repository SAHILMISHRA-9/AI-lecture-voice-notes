// server/api/transcribe.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import fs from "fs";
import FormData from "form-data";
import fetch from "node-fetch";

interface AssemblyAIUploadResponse {
  upload_url: string;
  status?: string;
  [key: string]: any;
}

interface AssemblyAITranscriptResponse {
  id: string;
  status: string;
  text?: string;
  [key: string]: any;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const file = req.body.file; // FormData file from frontend
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    // Prepare form-data for AssemblyAI upload
    const form = new FormData();
    form.append("file", file, { filename: "lecture" });

    // Upload file to AssemblyAI
    const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: {
        authorization: process.env.ASSEMBLYAI_API_KEY!,
      },
      body: form,
    });

    const data = (await uploadRes.json()) as AssemblyAIUploadResponse;

    if (!data.upload_url) {
      return res.status(500).json({ error: "Upload failed: no URL returned" });
    }

    // Start transcription
    const transcriptRes = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        authorization: process.env.ASSEMBLYAI_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ audio_url: data.upload_url }),
    });

    const transcript = (await transcriptRes.json()) as AssemblyAITranscriptResponse;

    res.status(200).json(transcript);
  } catch (err: any) {
    console.error("Transcription API error:", err);
    res.status(500).json({ error: err?.message || "Unknown error" });
  }
}
