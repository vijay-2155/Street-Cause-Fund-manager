import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Calendar, User, Tag, CalendarDays, Share2 } from "lucide-react";
import { getPublicBlogPost } from "@/app/actions/blog";

interface BlogPostPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getPublicBlogPost(id);
  if (!post) return { title: "Post Not Found" };

  const description = post.excerpt || post.content.slice(0, 155) + "…";

  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      type: "article",
      publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      authors: post.author?.fullName ? [post.author.fullName] : undefined,
      images: post.coverImageUrl
        ? [{ url: post.coverImageUrl, width: 1200, height: 630, alt: post.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: post.coverImageUrl ? [post.coverImageUrl] : undefined,
    },
  };
}

const categoryStyles: Record<string, { bg: string; text: string; border: string; label: string; dot: string }> = {
  announcement: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Announcement", dot: "bg-blue-500" },
  story: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Story", dot: "bg-emerald-500" },
  update: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", label: "Update", dot: "bg-orange-500" },
  general: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", label: "General", dot: "bg-violet-500" },
};

function renderContent(content: string) {
  const paragraphs = content.split(/\n\n+/);
  return paragraphs.map((para, i) => {
    const trimmed = para.trim();
    if (!trimmed) return null;
    const lines = trimmed.split("\n");
    return (
      <p key={i} className="mb-6 text-gray-600 leading-[1.85] text-[17px]">
        {lines.map((line, j) => (
          <span key={j}>
            {line}
            {j < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    );
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { id: slug } = await params;
  const post = await getPublicBlogPost(slug);

  if (!post) notFound();

  // JSON-LD structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.content.slice(0, 155),
    image: post.coverImageUrl || undefined,
    datePublished: post.publishedAt
      ? new Date(post.publishedAt).toISOString()
      : new Date(post.createdAt!).toISOString(),
    author: post.author?.fullName
      ? { "@type": "Person", name: post.author.fullName }
      : { "@type": "Organization", name: "Street Cause" },
    publisher: {
      "@type": "Organization",
      name: "Street Cause",
      logo: {
        "@type": "ImageObject",
        url: "https://streetcausefunds.vercel.app/icons/logo.png",
      },
    },
  };

  const cat = categoryStyles[post.category || "general"] || categoryStyles.general;
  const publishDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";
  const eventName = (post as any).event?.name;
  const eventId = (post as any).event?.id;
  const readTime = Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200));

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Poppins', 'Inter', sans-serif" }}>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ─── Navbar ─── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/icons/logo.png" alt="Street Cause" width={36} height={36} className="rounded-lg" />
            <span className="font-bold text-gray-900 text-sm tracking-tight hidden sm:block">Street Cause</span>
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Posts
          </Link>
        </div>
      </header>

      {/* ─── Article ─── */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-16">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${cat.bg} ${cat.text} ${cat.border}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
            {cat.label}
          </span>
          {eventName && (
            <Link
              href={`/blog?event=${eventId}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              <CalendarDays className="h-3 w-3" />
              {eventName}
            </Link>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-gray-900 leading-[1.15] mb-6 tracking-tight">
          {post.title}
        </h1>

        {/* Author & Meta Bar */}
        <div className="flex items-center justify-between gap-4 mb-8 pb-8 border-b border-gray-100 flex-wrap">
          <div className="flex items-center gap-3">
            {post.author?.avatarUrl ? (
              <img src={post.author.avatarUrl} className="w-10 h-10 rounded-full" alt="" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-sm font-bold text-gray-500">
                {post.author?.fullName?.[0] || "S"}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900">{post.author?.fullName || "Street Cause"}</p>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                {publishDate && <span>{publishDate}</span>}
                <span>·</span>
                <span>{readTime} min read</span>
              </div>
            </div>
          </div>
          {post.club?.name && (
            <div className="flex items-center gap-2">
              <Image src="/icons/logo.png" alt="" width={20} height={20} className="rounded" />
              <span className="text-xs font-semibold text-gray-500">{post.club.name}</span>
            </div>
          )}
        </div>

        {/* Excerpt */}
        {post.excerpt && (
          <div className="bg-gray-50 border-l-4 border-[#0066FF] rounded-r-xl px-6 py-5 mb-10">
            <p className="text-gray-600 font-medium leading-relaxed italic">
              {post.excerpt}
            </p>
          </div>
        )}

        {/* Cover Image */}
        {post.coverImageUrl && (
          <div className="mb-10 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
            <img
              src={post.coverImageUrl}
              alt={post.title}
              className="w-full object-cover max-h-[480px]"
            />
          </div>
        )}

        {/* Content */}
        <div>
          {renderContent(post.content)}
        </div>

        {/* Tags & Share: bottom section */}
        <div className="mt-12 pt-8 border-t border-gray-200 flex items-center justify-between flex-wrap gap-4">
          <Link
            href={eventName ? `/blog?event=${eventId}` : "/blog"}
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-900 bg-gray-100 hover:bg-gray-200 px-5 py-2.5 rounded-full transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {eventName ? `More from ${eventName}` : "All posts"}
          </Link>
        </div>
      </article>

      {/* ─── Footer ─── */}
      <footer className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image src="/icons/logo.png" alt="Street Cause" width={32} height={32} className="rounded-lg" />
            <div>
              <span className="font-bold text-gray-900 text-sm block">Street Cause</span>
              <span className="text-[10px] text-gray-400 font-medium">We Care</span>
            </div>
          </div>
          <p className="text-xs text-gray-400">&copy; 2026 Street Cause. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
