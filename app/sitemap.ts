import type { MetadataRoute } from "next";

// The public site is a single page — the About view and each match detail
// are in-page views, not separate routes — so the root URL is the only
// entry that belongs in the sitemap.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://syndicate.run.place/",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
