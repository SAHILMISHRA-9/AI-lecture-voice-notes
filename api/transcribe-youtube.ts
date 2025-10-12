import type { VercelRequest, VercelResponse } from "@vercel/node";
import ytdl from "ytdl-core";
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
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "No YouTube URL provided" });

    // Download audio
    const audioStream = ytdl(url, { filter: "audioonly" });
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) chunks.push(Buffer.from(chunk));
    const audioBuffer = Buffer.concat(chunks);

    const form = new FormData();
    form.append("file", audioBuffer, { filename: "youtube.mp3" });

    const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: { authorization: process.env.ASSEMBLYAI_API_KEY! },
      body: form,
    });

    const uploadData = (await uploadRes.json()) as UploadResponse;

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
