import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { quotes } from "@/db/schema";
import { getMediaStorage } from "@/lib/media-storage";
import { quotePdfKey } from "@/lib/quote-pdf";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(id)) {
    return new Response("Not found", { status: 404 });
  }

  const [quote] = await db
    .select({ id: quotes.id, pdfUrl: quotes.pdfUrl })
    .from(quotes)
    .where(eq(quotes.id, id))
    .limit(1);

  if (!quote?.pdfUrl) {
    return new Response("Not found", { status: 404 });
  }

  const media = await getMediaStorage().get(quotePdfKey(id));
  if (!media) {
    return new Response("Not found", { status: 404 });
  }

  const chunks: Buffer[] = [];
  for await (const chunk of media.body) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const buffer = Buffer.concat(chunks);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(media.contentLength),
      "Content-Disposition": `attachment; filename="terraauto-quote-${id.slice(0, 8)}.pdf"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
