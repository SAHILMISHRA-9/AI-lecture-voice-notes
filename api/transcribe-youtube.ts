import type { VercelRequest, VercelResponse } from "@vercel/node";
import fetch from "node-fetch";

interface AssemblyAITranscriptResponse {
  id: string;
  status: string;
  text?: string;
  error?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "No YouTube URL provided" });

    const response = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        authorization: process.env.ASSEMBLYAI_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ audio_url: url }),
    });

    const transcriptData = (await response.json()) as AssemblyAITranscriptResponse;
    res.status(200).json(transcriptData);
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
}
