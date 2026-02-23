"use client";

import { ArrowLeft, BookOpen, PenSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createBlogPost } from "@/app/actions/blog";
import { BlogPostForm } from "@/components/blog/blog-post-form";

export default function NewBlogPostPage() {
  const handleCreate = async (data: {
    title: string;
    excerpt: string;
    content: string;
    coverImageUrl: string;
    category: "announcement" | "story" | "update" | "general";
    status: "draft" | "published";
    eventId?: string;
  }) => {
    await createBlogPost(data);
  };

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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">New Blog Post</h1>
          <p className="text-gray-600 mt-1 font-medium text-sm">Share a story, announcement, or update</p>
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
          <BlogPostForm onSave={handleCreate} submitLabel="Publish Post" />
        </CardContent>
      </Card>
    </div>
  );
}
