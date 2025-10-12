async function parse(res: Response): Promise<any> {
  let body = "";
  try {
    body = await res.clone().text();
  } catch {
    body = "";
  }
  let data: any = {};
  try { data = body ? JSON.parse(body) : {}; } catch {}
  if (!res.ok) throw new Error(String((data && data.error) || body || res.statusText));
  return data;
}

export async function transcribeFile(file: File): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const res = await fetch("/api/transcribe/file", {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream", "x-filename": file.name },
    body: buf,
  });
  const data = await parse(res);
  return String(data.text || "");
}

export async function transcribeYouTube(url: string): Promise<string> {
  const res = await fetch("/api/transcribe/youtube", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const data = await parse(res);
  return String(data.text || "");
}

export async function startTranscriptionFile(file: File): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const res = await fetch("/api/transcribe/start/file", {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream", "x-filename": file.name },
    body: buf,
  });
  const data = await parse(res);
  return String(data.id || "");
}

export async function startTranscriptionYouTube(url: string): Promise<string> {
  const res = await fetch("/api/transcribe/start/youtube", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const data = await parse(res);
  return String(data.id || "");
}

export async function getTranscriptionStatus(id: string): Promise<{ status: string; text?: string; error?: string }> {
  const res = await fetch(`/api/transcribe/status/${encodeURIComponent(id)}`);
  const data = await parse(res);
  return data as any;
}
