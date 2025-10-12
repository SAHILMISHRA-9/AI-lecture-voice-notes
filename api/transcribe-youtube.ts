import type { VercelRequest, VercelResponse } from "@vercel/node";
import fetch from "node-fetch";

interface AssemblyAITranscript {
  id: string;
  status: string;
  text?: string;
  error?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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

    const data: AssemblyAITranscript = await r.json() as AssemblyAITranscript;

    if (data.error) {
      return res.status(500).json({ error: data.error });
    }

    res.status(200).json(data);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
