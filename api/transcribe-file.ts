import type { VercelRequest, VercelResponse } from "@vercel/node";
import FormData from "form-data";
import fetch from "node-fetch";

interface UploadResponse {
  upload_url: string;
}

interface TranscriptResponse {
  id: string;
  status: string;
  text?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const file = req.body.file; // base64 string from frontend
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const buffer = Buffer.from(file, "base64");
    const form = new FormData();
    form.append("file", buffer, { filename: "upload.mp3" });

    // Upload to AssemblyAI
    const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: { authorization: process.env.ASSEMBLYAI_API_KEY! },
      body: form,
    });

    // ✅ Cast unknown to proper type
    const uploadData = (await uploadRes.json()) as UploadResponse;

    // Start transcription
    const transcriptRes = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        authorization: process.env.ASSEMBLYAI_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ audio_url: uploadData.upload_url }),
    });

    const transcriptData = (await transcriptRes.json()) as TranscriptResponse;

    res.status(200).json(transcriptData);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
