import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/crm", "/login", "/api/"],
      },
    ],
    sitemap: "https://terraauto.uz/sitemap.xml",
  };
}
