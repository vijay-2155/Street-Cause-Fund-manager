"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  PenSquare,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Globe,
  FileText,
  BookOpen,
  Loader2,
  Calendar,
  CalendarDays,
  Tag,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getBlogPosts, deleteBlogPost, togglePublishBlogPost } from "@/app/actions/blog";

type Post = Awaited<ReturnType<typeof getBlogPosts>>[number];

const categoryColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  announcement: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  story: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  update: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200", dot: "bg-orange-500" },
  general: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", dot: "bg-violet-500" },
};

const categoryLabels: Record<string, string> = {
  announcement: "Announcement",
  story: "Story",
  update: "Update",
  general: "General",
};

export default function BlogManagePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await getBlogPosts();
      setPosts(data);
    } catch {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleTogglePublish = async (post: Post) => {
    const publish = post.status !== "published";
    setActionId(post.id);
    try {
      await togglePublishBlogPost(post.id, publish);
      toast.success(publish ? "Post published!" : "Post moved to draft");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (post: Post) => {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    setActionId(post.id);
    try {
      await deleteBlogPost(post.id);
      toast.success("Post deleted");
      setPosts((p) => p.filter((x) => x.id !== post.id));
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    } finally {
      setActionId(null);
    }
  };

  const published = posts.filter((p) => p.status === "published");
  const drafts = posts.filter((p) => p.status === "draft");

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="bg-gradient-to-br from-[#0066FF] to-[#0052CC] p-3 rounded-xl shadow-lg ring-4 ring-[#E6F2FF]">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Blog</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage your organization's blog posts</p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href="/blog" target="_blank" className="flex-1 sm:flex-none">
            <Button variant="outline" size="sm" className="w-full gap-2 border-2 border-gray-300 font-semibold rounded-xl h-10">
              <Globe className="h-4 w-4" />
              View Blog
            </Button>
          </Link>
          <Link href="/posts/new" className="flex-1 sm:flex-none">
            <Button size="sm" className="w-full bg-[#0066FF] hover:bg-[#0052CC] text-white gap-2 shadow-lg font-semibold rounded-xl h-10">
              <Plus className="h-4 w-4" />
              New Post
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: posts.length, color: "#0066FF", bg: "#E6F2FF" },
          { label: "Published", value: published.length, color: "#10B981", bg: "#D1FAE5" },
          { label: "Drafts", value: drafts.length, color: "#F59E0B", bg: "#FEF3C7" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border-2 p-4 text-center transition-all hover:shadow-md"
            style={{ backgroundColor: s.bg, borderColor: s.color + "30" }}
          >
            <p className="text-2xl sm:text-3xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ─── Posts List ─── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
        </div>
      ) : posts.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300 rounded-2xl">
          <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 bg-[#E6F2FF] rounded-2xl flex items-center justify-center">
              <FileText className="h-8 w-8 text-[#0066FF]" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">No blog posts yet</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Share your organization's stories, announcements, and updates with the community.
            </p>
            <Link href="/posts/new">
              <Button className="bg-[#0066FF] hover:bg-[#0052CC] text-white mt-2 gap-2 rounded-xl">
                <Plus className="h-4 w-4" />
                Write Your First Post
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const isLoading = actionId === post.id;
            const isPublished = post.status === "published";
            const cat = categoryColors[post.category || "general"] || categoryColors.general;
            return (
              <div
                key={post.id}
                className="bg-white rounded-2xl border-2 border-gray-200 hover:border-[#0066FF]/30 transition-all p-4 group"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Cover Image - hidden on very small screens */}
                    {post.coverImageUrl ? (
                      <img
                        src={post.coverImageUrl}
                        alt={post.title}
                        className="hidden sm:block w-20 h-20 rounded-xl object-cover shrink-0 border border-gray-200"
                      />
                    ) : (
                      <div className="hidden sm:flex w-20 h-20 rounded-xl bg-gray-50 shrink-0 items-center justify-center border-2 border-gray-100">
                        <FileText className="h-7 w-7 text-gray-300" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-sm leading-snug flex-1 group-hover:text-[#0066FF] transition-colors">
                          {post.title}
                        </h3>
                        <Badge
                          className={`text-[10px] border shrink-0 font-bold ${
                            isPublished
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-gray-100 text-gray-500 border-gray-200"
                          }`}
                        >
                          {isPublished ? "Published" : "Draft"}
                        </Badge>
                      </div>

                      {post.excerpt && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{post.excerpt}</p>
                      )}

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {post.category && (
                          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-bold ${cat.bg} ${cat.text} ${cat.border}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${cat.dot}`} />
                            {categoryLabels[post.category] || post.category}
                          </span>
                        )}
                        {(post as any).event?.name && (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-bold bg-blue-50 text-blue-700 border-blue-200">
                            <CalendarDays className="h-2.5 w-2.5" />
                            {(post as any).event.name}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium">
                          <Calendar className="h-2.5 w-2.5" />
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                            : new Date(post.createdAt!).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                        {post.author?.fullName && (
                          <span className="text-[10px] text-gray-400 font-medium">by {post.author.fullName}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions - full row on mobile, inline on desktop */}
                  <div className="flex items-center gap-1.5 sm:justify-end border-t sm:border-0 border-gray-100 pt-2 sm:pt-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTogglePublish(post)}
                      disabled={isLoading}
                      className="h-9 px-3 gap-1.5 text-xs border-2 border-gray-200 rounded-xl font-semibold flex-1 sm:flex-none"
                    >
                      {isLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isPublished ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                      {isPublished ? "Unpublish" : "Publish"}
                    </Button>
                    <Link href={`/posts/${post.id}/edit`} className="flex-1 sm:flex-none">
                      <Button size="sm" variant="outline" className="h-9 w-full sm:w-9 p-0 border-2 border-gray-200 rounded-xl gap-1.5">
                        <PenSquare className="h-3.5 w-3.5" />
                        <span className="sm:hidden text-xs">Edit</span>
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(post)}
                      disabled={isLoading}
                      className="h-9 flex-1 sm:flex-none sm:w-9 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 border-2 border-red-200 rounded-xl gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sm:hidden text-xs">Delete</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
