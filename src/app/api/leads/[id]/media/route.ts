import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { leadMedia, leads } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { getMediaStorage } from "@/lib/media-storage";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const PHOTO_MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

const VIDEO_MIME_EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

const PHOTO_MAX_BYTES = 10 * 1024 * 1024;
const VIDEO_MAX_BYTES = 100 * 1024 * 1024;

export async function GET(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const media = await db
    .select()
    .from(leadMedia)
    .where(eq(leadMedia.leadId, id))
    .orderBy(asc(leadMedia.sortOrder), asc(leadMedia.createdAt));

  return NextResponse.json({ media });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const [lead] = await db
      .select({ id: leads.id })
      .from(leads)
      .where(eq(leads.id, id))
      .limit(1);

    if (!lead) {
      return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);
    const caption = (formData.get("caption") as string | null)?.trim() || null;
    const published = formData.get("published") === "true";

    if (files.length === 0) {
      return NextResponse.json({ error: "Файлы не переданы" }, { status: 400 });
    }

    const storage = getMediaStorage();
    const created = [];

    for (const file of files) {
      const mime = file.type;
      const isPhoto = mime in PHOTO_MIME_EXT;
      const isVideo = mime in VIDEO_MIME_EXT;

      if (!isPhoto && !isVideo) {
        return NextResponse.json(
          { error: `Неподдерживаемый тип файла: ${file.name || mime}` },
          { status: 400 }
        );
      }

      const limit = isPhoto ? PHOTO_MAX_BYTES : VIDEO_MAX_BYTES;
      if (file.size > limit) {
        const limitMb = Math.round(limit / (1024 * 1024));
        return NextResponse.json(
          { error: `Файл «${file.name}» превышает лимит ${limitMb} МБ` },
          { status: 400 }
        );
      }

      const mediaId = crypto.randomUUID();
      const ext = isPhoto ? PHOTO_MIME_EXT[mime] : VIDEO_MIME_EXT[mime];
      const storageKey = `leads/${id}/${mediaId}.${ext}`;

      const buffer = Buffer.from(await file.arrayBuffer());
      await storage.put(storageKey, buffer, mime);

      const [row] = await db
        .insert(leadMedia)
        .values({
          id: mediaId,
          leadId: id,
          kind: isPhoto ? "photo" : "video",
          url: `/api/media/${mediaId}`,
          storageKey,
          caption,
          published,
          mimeType: mime,
          fileSize: file.size,
        })
        .returning();

      created.push(row);
    }

    return NextResponse.json({ media: created });
  } catch (error) {
    console.error("Failed to upload lead media:", error);
    return NextResponse.json({ error: "Ошибка загрузки файлов" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { mediaId, caption, published } = body;

    if (!mediaId) {
      return NextResponse.json({ error: "mediaId is required" }, { status: 400 });
    }

    const setFields: Record<string, unknown> = {};
    if (caption !== undefined) setFields.caption = caption;
    if (published !== undefined) setFields.published = published;

    const [row] = await db
      .update(leadMedia)
      .set(setFields)
      .where(and(eq(leadMedia.id, mediaId), eq(leadMedia.leadId, id)))
      .returning();

    if (!row) {
      return NextResponse.json({ error: "Материал не найден" }, { status: 404 });
    }

    return NextResponse.json({ media: row });
  } catch (error) {
    console.error("Failed to update lead media:", error);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const mediaId = searchParams.get("mediaId");

  if (!mediaId) {
    return NextResponse.json({ error: "mediaId is required" }, { status: 400 });
  }

  const [row] = await db
    .select()
    .from(leadMedia)
    .where(and(eq(leadMedia.id, mediaId), eq(leadMedia.leadId, id)))
    .limit(1);

  if (!row) {
    return NextResponse.json({ error: "Материал не найден" }, { status: 404 });
  }

  if (row.storageKey) {
    try {
      await getMediaStorage().delete(row.storageKey);
    } catch (error) {
      console.error("Failed to delete media file:", error);
    }
  }

  await db.delete(leadMedia).where(eq(leadMedia.id, mediaId));

  return NextResponse.json({ success: true });
}
