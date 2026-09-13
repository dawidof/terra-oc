import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leadMedia } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Readable } from "stream";
import { getMediaStorage, type MediaRange } from "@/lib/media-storage";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [media] = await db
    .select()
    .from(leadMedia)
    .where(eq(leadMedia.id, id))
    .limit(1);

  if (!media || !media.storageKey) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rangeHeader = request.headers.get("range");
  let range: MediaRange | undefined;

  if (rangeHeader) {
    const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
    if (match) {
      const start = match[1] ? parseInt(match[1], 10) : undefined;
      const end = match[2] ? parseInt(match[2], 10) : undefined;
      if (start !== undefined || end !== undefined) {
        range = {
          start: start ?? 0,
          end: end ?? Number.MAX_SAFE_INTEGER - 1,
        };
      }
    }
  }

  try {
    const result = await getMediaStorage().get(media.storageKey, range);
    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (range && !result.contentRange) {
      return NextResponse.json(
        { error: "Range not satisfiable" },
        { status: 416 }
      );
    }

    const headers = new Headers({
      "Content-Type": media.mimeType || "application/octet-stream",
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600",
      ...(result.contentRange ? { "Content-Range": result.contentRange } : {}),
    });

    return new NextResponse(Readable.toWeb(result.body) as ReadableStream, {
      status: range ? 206 : 200,
      headers,
    });
  } catch (error) {
    console.error("Failed to serve media:", error);
    return NextResponse.json({ error: "Ошибка загрузки файла" }, { status: 500 });
  }
}
