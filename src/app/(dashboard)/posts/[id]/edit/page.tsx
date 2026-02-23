import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PenSquare, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBlogPost, updateBlogPost } from "@/app/actions/blog";
import { BlogPostForm } from "@/components/blog/blog-post-form";

interface EditBlogPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  const { id } = await params;
  const post = await getBlogPost(id);

  if (!post) notFound();

  async function handleUpdate(data: {
    title: string;
    excerpt: string;
    content: string;
    coverImageUrl: string;
    category: "announcement" | "story" | "update" | "general";
    status: "draft" | "published";
    eventId?: string;
  }) {
    "use server";
    await updateBlogPost(id, data);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/posts">
          <Button variant="outline" size="icon" className="border-2 border-gray-300 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="bg-gradient-to-br from-[#0066FF] to-[#0052CC] p-3 rounded-xl shadow-lg ring-4 ring-[#E6F2FF]">
          <PenSquare className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Edit Post</h1>
          <p className="text-gray-600 mt-1 font-medium text-sm truncate max-w-xs">{post.title}</p>
        </div>
      </div>

      <Card className="border-2 border-gray-200 shadow-lg">
        <CardHeader className="border-b-2 border-gray-200 bg-gradient-to-r from-[#E6F2FF] to-white">
          <CardTitle className="text-gray-900 font-bold flex items-center gap-2">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <BookOpen className="h-5 w-5 text-[#0066FF]" />
            </div>
            Post Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <BlogPostForm
            defaultValues={{
              title: post.title,
              excerpt: post.excerpt || "",
              content: post.content,
              coverImageUrl: post.coverImageUrl || "",
              category: post.category || "general",
              status: post.status || "draft",
              eventId: post.eventId || "",
            }}
            onSave={handleUpdate}
            submitLabel={post.status === "published" ? "Update & Publish" : "Publish"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
