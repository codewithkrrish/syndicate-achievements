import type { MetadataRoute } from "next";
import { getRecordIndex } from "@/lib/data";
import { detailPath } from "@/lib/format";

// Public routes: home, one page per record collection, and one
// shareable page per filed match (/creators-record/001 style). About
// is an in-page view on the home page, not a route, so it gets no
// entry of its own. Failure-tolerant: if the database is unreachable
// the sitemap still lists the three collection routes.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const base: MetadataRoute.Sitemap = [
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

  const index = await getRecordIndex();
  const matches: MetadataRoute.Sitemap = index.map((r) => ({
    url: `https://syndicate.run.place${detailPath(r)}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...base, ...matches];
}
