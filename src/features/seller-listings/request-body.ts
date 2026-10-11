export async function readBoundedBody(request: Request, maxBytes: number) {
  if (Number(request.headers.get("content-length")) > maxBytes) throw new Error("size_limit");
  const reader = request.body?.getReader(); if (!reader) throw new Error("missing_body");
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > maxBytes) throw new Error("size_limit"); chunks.push(value); }
  } finally { await reader.cancel(); }
  return Buffer.concat(chunks);
}
