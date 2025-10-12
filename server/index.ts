import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleTranscribeFile, handleTranscribeYouTube, handleStartTranscribeFile, handleStartTranscribeYouTube, handleTranscribeStatus } from "./routes/transcribe";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Transcription routes (sync)
  app.post("/api/transcribe/file", express.raw({ type: "application/octet-stream", limit: "100mb" }) as any, handleTranscribeFile);
  app.post("/api/transcribe/youtube", handleTranscribeYouTube);

  // Transcription routes (background)
  app.post("/api/transcribe/start/file", express.raw({ type: "application/octet-stream", limit: "100mb" }) as any, handleStartTranscribeFile);
  app.post("/api/transcribe/start/youtube", handleStartTranscribeYouTube);
  app.get("/api/transcribe/status/:id", handleTranscribeStatus);

  return app;
}
