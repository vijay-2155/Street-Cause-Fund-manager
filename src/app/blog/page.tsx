import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Calendar, ArrowRight, Tag, CalendarDays, Search, ArrowUpRight } from "lucide-react";
import { getPublicBlogPosts, getPublicBlogEvents } from "@/app/actions/blog";

export const metadata: Metadata = {
  title: "Blog — Stories, Updates & Announcements",
  description:
    "Read the latest stories, updates, and announcements from Street Cause. Stay informed about our events, community impact, and volunteer activities.",
  openGraph: {
    title: "Street Cause Blog",
    description:
      "Stories, updates, and announcements from Street Cause — India's leading student-run NGO.",
    type: "website",
  },
};

const categoryStyles: Record<string, { bg: string; text: string; border: string; label: string; dot: string }> = {
  announcement: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Announcement", dot: "bg-blue-500" },
  story: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", label: "Story", dot: "bg-emerald-500" },
  update: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", label: "Update", dot: "bg-orange-500" },
  general: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", label: "General", dot: "bg-violet-500" },
};

interface PublicBlogPageProps {
  searchParams: Promise<{ event?: string }>;
}

export default async function PublicBlogPage({ searchParams }: PublicBlogPageProps) {
  const sp = await searchParams;
  const activeEvent = sp.event || "";

  const [posts, events] = await Promise.all([
    getPublicBlogPosts(activeEvent || undefined),
    getPublicBlogEvents(),
  ]);

  const featuredPost = posts[0];
  const restPosts = posts.slice(1);

  return (
    <div className="min-h-screen bg-[#FAFAFA]" style={{ fontFamily: "'Poppins', 'Inter', sans-serif" }}>
      {/* ─── Navbar ─── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/icons/logo.png" alt="Street Cause" width={40} height={40} className="rounded-lg" />
            <div className="hidden sm:block">
              <span className="font-bold text-gray-900 text-sm tracking-tight leading-none block">Street Cause</span>
              <span className="text-[10px] text-gray-400 font-medium">We Care</span>
            </div>
          </Link>
          <nav className="flex items-center gap-6">
            <span className="text-sm font-semibold text-gray-900">Blog</span>
            <Link
              href="/sign-in"
              className="text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 px-4 py-2 rounded-full transition-colors"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#0066FF]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#0066FF]/8 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9zdmc+')] opacity-40" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white/80 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6 border border-white/10">
              <div className="w-1.5 h-1.5 bg-[#0066FF] rounded-full animate-pulse" />
              Street Cause Blog
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-4 tracking-tight">
              Stories that{" "}
              <span className="bg-gradient-to-r from-[#0066FF] to-[#66B2FF] bg-clip-text text-transparent">
                inspire change
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-lg leading-relaxed">
              Impact stories, announcements, and updates from our community making a difference.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Event Filter Tabs ─── */}
      {events.length > 0 && (
        <div className="sticky top-16 z-40 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-1.5 py-3 overflow-x-auto scrollbar-hide">
              <Link
                href="/blog"
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  !activeEvent
                    ? "bg-gray-900 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All Posts
              </Link>
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/blog?event=${event.id}`}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    activeEvent === event.id
                      ? "bg-gray-900 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <CalendarDays className="h-3 w-3" />
                  {event.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {posts.length === 0 ? (
          /* ─── Empty State ─── */
          <div className="text-center py-24">
            <div className="relative inline-block mb-6">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Search className="h-8 w-8 text-gray-300" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {activeEvent ? "No posts for this event yet" : "No posts yet"}
            </h2>
            <p className="text-gray-500 max-w-sm mx-auto">
              {activeEvent
                ? "Check back soon for updates on this event."
                : "We're working on some great content. Check back soon!"}
            </p>
            {activeEvent && (
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 mt-6 text-sm font-bold text-gray-900 bg-gray-100 hover:bg-gray-200 px-5 py-2.5 rounded-full transition-colors"
              >
                ← View all posts
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-16">
            {/* ─── Featured Post (Hero Card) ─── */}
            {featuredPost && (
              <Link
                href={`/blog/${featuredPost.slug}`}
                className="group block bg-white rounded-3xl overflow-hidden border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="grid md:grid-cols-2">
                  {/* Image */}
                  <div className="relative h-64 md:h-full min-h-[300px] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                    {featuredPost.coverImageUrl ? (
                      <img
                        src={featuredPost.coverImageUrl}
                        alt={featuredPost.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image src="/icons/logo.png" alt="Street Cause" width={80} height={80} className="opacity-20" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/90 backdrop-blur-md text-gray-900 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                        Latest
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 md:p-10 flex flex-col justify-center">
                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      {(() => {
                        const cat = categoryStyles[featuredPost.category || "general"] || categoryStyles.general;
                        return (
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${cat.bg} ${cat.text} ${cat.border}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                            {cat.label}
                          </span>
                        );
                      })()}
                      {(featuredPost as any).event?.name && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          <CalendarDays className="h-3 w-3" />
                          {(featuredPost as any).event.name}
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-3 group-hover:text-[#0066FF] transition-colors">
                      {featuredPost.title}
                    </h2>
                    {featuredPost.excerpt && (
                      <p className="text-gray-500 leading-relaxed mb-6 line-clamp-3">
                        {featuredPost.excerpt}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-3">
                        {featuredPost.author?.avatarUrl ? (
                          <img src={featuredPost.author.avatarUrl} className="w-8 h-8 rounded-full" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-xs font-bold text-gray-500">
                            {featuredPost.author?.fullName?.[0] || "S"}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{featuredPost.author?.fullName || "Street Cause"}</p>
                          <p className="text-xs text-gray-400">
                            {featuredPost.publishedAt
                              ? new Date(featuredPost.publishedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-[#0066FF] flex items-center justify-center transition-colors">
                        <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* ─── Post Grid ─── */}
            {restPosts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold text-gray-900">More Posts</h3>
                  <div className="h-px flex-1 bg-gray-200 ml-6" />
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {restPosts.map((post) => {
                    const cat = categoryStyles[post.category || "general"] || categoryStyles.general;
                    const date = post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                      : "";
                    const eventName = (post as any).event?.name;
                    return (
                      <Link
                        key={post.id}
                        href={`/blog/${post.slug}`}
                        className="group block bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200"
                      >
                        {/* Image */}
                        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
                          {post.coverImageUrl ? (
                            <img
                              src={post.coverImageUrl}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image src="/icons/logo.png" alt="Street Cause" width={48} height={48} className="opacity-15" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-5">
                          {/* Badges */}
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${cat.bg} ${cat.text} ${cat.border}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                              {cat.label}
                            </span>
                            {eventName && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                <CalendarDays className="h-2.5 w-2.5" />
                                {eventName}
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-gray-900 leading-snug mb-2 group-hover:text-[#0066FF] transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          {post.excerpt && (
                            <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">
                              {post.excerpt}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                {post.author?.fullName?.[0] || "S"}
                              </div>
                              <span className="text-xs text-gray-400">{date}</span>
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-[#0066FF] group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ─── Footer ─── */}
      <footer className="bg-white border-t border-gray-100 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image src="/icons/logo.png" alt="Street Cause" width={36} height={36} className="rounded-lg" />
              <div>
                <span className="font-bold text-gray-900 text-sm block">Street Cause</span>
                <span className="text-[10px] text-gray-400 font-medium">We Care · Since 2009</span>
              </div>
            </div>
            <p className="text-xs text-gray-400">&copy; 2026 Street Cause. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
