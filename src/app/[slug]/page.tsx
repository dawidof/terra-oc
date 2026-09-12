import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { contentPages } from "@/db/schema";
import { sanitizeHtml } from "@/lib/sanitize-html";

export const revalidate = 300;

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPublishedPage(slug: string) {
  const [page] = await db
    .select({
      id: contentPages.id,
      slug: contentPages.slug,
      title: contentPages.title,
      contentHtml: contentPages.contentHtml,
      seoTitle: contentPages.seoTitle,
      seoDescription: contentPages.seoDescription,
      updatedAt: contentPages.updatedAt,
    })
    .from(contentPages)
    .where(and(eq(contentPages.slug, slug), eq(contentPages.published, true)))
    .limit(1);

  return page || null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPage(slug);

  if (!page) return {};

  return {
    title: page.seoTitle || `${page.title} — TerraAuto`,
    description: page.seoDescription || undefined,
  };
}

export default async function ContentPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPublishedPage(slug);

  if (!page) notFound();

  const html = sanitizeHtml(page.contentHtml || "");

  return (
    <div className="container mx-auto px-4 py-10 sm:px-6">
      <article className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold tracking-tight">{page.title}</h1>
        {html ? (
          <div
            className="rich-text"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <p className="text-muted-foreground">Содержимое пока не добавлено</p>
        )}
      </article>
    </div>
  );
}
