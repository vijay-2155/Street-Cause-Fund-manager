import type { MetadataRoute } from "next";
import { getPublicBlogPosts } from "@/app/actions/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://streetcausefunds.vercel.app";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/donate`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blood-donors`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  // Dynamic blog post pages
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const posts = await getPublicBlogPosts();
    blogPages = (posts || []).map((post: any) => ({
      url: `${baseUrl}/blog/${post.id}`,
      lastModified: new Date(post.publishedAt || post.createdAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  } catch {}

  return [...staticPages, ...blogPages];
}
