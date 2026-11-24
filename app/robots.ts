import type { MetadataRoute } from "next";

// The public archive may be indexed. The admin panel must never be:
// it is also protected by auth, but keeping it out of indexes is free
// defense in depth — crawlers should not even learn the paths exist.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/"],
      },
    ],
  };
}
