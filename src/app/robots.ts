import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://streetcausefunds.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/donations",
          "/expenses",
          "/approvals",
          "/events",
          "/posts",
          "/reports",
          "/settings",
          "/team",
          "/api/",
          "/sign-in",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
