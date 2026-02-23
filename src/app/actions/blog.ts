"use server";

import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { getCurrentMember, requireRole } from "@/lib/auth/helpers";
import { eq, desc, and } from "drizzle-orm";

// ─── Slug Helper ───────────────────────────────────────────────────────────────

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  return `${base}-${Date.now()}`;
}

// ─── Dashboard Actions (require auth) ─────────────────────────────────────────

export async function getBlogPosts() {
  const { member } = await getCurrentMember();

  return db.query.blogPosts.findMany({
    where: eq(blogPosts.clubId, member.clubId!),
    with: {
      author: { columns: { fullName: true, avatarUrl: true } },
      event: { columns: { name: true } },
    },
    orderBy: desc(blogPosts.createdAt),
  });
}

export async function getBlogPost(id: string) {
  const { member } = await getCurrentMember();

  return db.query.blogPosts.findFirst({
    where: and(eq(blogPosts.id, id), eq(blogPosts.clubId, member.clubId!)),
    with: {
      author: { columns: { fullName: true, avatarUrl: true } },
      event: { columns: { name: true } },
    },
  });
}

export async function createBlogPost(data: {
  title: string;
  excerpt?: string;
  content: string;
  coverImageUrl?: string;
  category: "announcement" | "story" | "update" | "general";
  status: "draft" | "published";
  eventId?: string;
}) {
  const member = await requireRole(["admin", "treasurer", "coordinator"]);

  const slug = generateSlug(data.title);

  const [post] = await db
    .insert(blogPosts)
    .values({
      clubId: member.clubId!,
      authorId: member.id,
      title: data.title.trim(),
      slug,
      excerpt: data.excerpt?.trim() || null,
      content: data.content.trim(),
      coverImageUrl: data.coverImageUrl || null,
      category: data.category,
      status: data.status,
      eventId: data.eventId || null,
      publishedAt: data.status === "published" ? new Date() : null,
    })
    .returning();

  return post;
}

export async function updateBlogPost(
  id: string,
  data: {
    title: string;
    excerpt?: string;
    content: string;
    coverImageUrl?: string;
    category: "announcement" | "story" | "update" | "general";
    status: "draft" | "published";
    eventId?: string;
  },
) {
  const member = await requireRole(["admin", "treasurer", "coordinator"]);

  const existing = await db.query.blogPosts.findFirst({
    where: and(eq(blogPosts.id, id), eq(blogPosts.clubId, member.clubId!)),
  });
  if (!existing) throw new Error("Post not found");

  const [updated] = await db
    .update(blogPosts)
    .set({
      title: data.title.trim(),
      excerpt: data.excerpt?.trim() || null,
      content: data.content.trim(),
      coverImageUrl: data.coverImageUrl || null,
      category: data.category,
      status: data.status,
      eventId: data.eventId || null,
      publishedAt:
        data.status === "published" && !existing.publishedAt
          ? new Date()
          : existing.publishedAt,
      updatedAt: new Date(),
    })
    .where(and(eq(blogPosts.id, id), eq(blogPosts.clubId, member.clubId!)))
    .returning();

  return updated;
}

export async function deleteBlogPost(id: string) {
  const member = await requireRole(["admin"]);

  await db
    .delete(blogPosts)
    .where(and(eq(blogPosts.id, id), eq(blogPosts.clubId, member.clubId!)));
}

export async function togglePublishBlogPost(id: string, publish: boolean) {
  const member = await requireRole(["admin", "treasurer", "coordinator"]);

  const existing = await db.query.blogPosts.findFirst({
    where: and(eq(blogPosts.id, id), eq(blogPosts.clubId, member.clubId!)),
  });
  if (!existing) throw new Error("Post not found");

  await db
    .update(blogPosts)
    .set({
      status: publish ? "published" : "draft",
      publishedAt:
        publish && !existing.publishedAt ? new Date() : existing.publishedAt,
      updatedAt: new Date(),
    })
    .where(and(eq(blogPosts.id, id), eq(blogPosts.clubId, member.clubId!)));
}

// ─── Public Actions (no auth needed) ──────────────────────────────────────────

export async function getPublicBlogPosts(eventId?: string) {
  const conditions = [eq(blogPosts.status, "published")];
  if (eventId) {
    conditions.push(eq(blogPosts.eventId, eventId));
  }

  return db.query.blogPosts.findMany({
    where: and(...conditions),
    with: {
      author: { columns: { fullName: true, avatarUrl: true } },
      club: { columns: { name: true } },
      event: { columns: { id: true, name: true } },
    },
    orderBy: desc(blogPosts.publishedAt),
  });
}

export async function getPublicBlogPost(slug: string) {
  return db.query.blogPosts.findFirst({
    where: and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")),
    with: {
      author: { columns: { fullName: true, avatarUrl: true } },
      club: { columns: { name: true } },
      event: { columns: { id: true, name: true } },
    },
  });
}

// ─── Public Events list (for filter tabs) ─────────────────────────────────────

export async function getPublicBlogEvents() {
  // Get all published posts, extract unique events
  const posts = await db.query.blogPosts.findMany({
    where: eq(blogPosts.status, "published"),
    with: { event: { columns: { id: true, name: true } } },
    columns: { id: true },
  });

  const eventMap = new Map<string, string>();
  posts.forEach((p: any) => {
    if (p.event?.id) eventMap.set(p.event.id, p.event.name);
  });

  return Array.from(eventMap, ([id, name]) => ({ id, name }));
}
