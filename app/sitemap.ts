import type { MetadataRoute } from "next";

// The public site has three routes now: the home page (hero, stats and
// a summary entry per collection) and one page per record collection.
// Match detail and About are in-page views, not separate routes, so
// they do not get sitemap entries of their own.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    {
      url: "https://syndicate.run.place/",
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://syndicate.run.place/creators-record",
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://syndicate.run.place/ordinary-record",
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}
