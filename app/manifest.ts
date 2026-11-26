import type { MetadataRoute } from "next";

// Web app manifest: lets members add the archive to a phone home screen
// with the guild icon and the site's near-black chrome, instead of a
// generic browser shortcut.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SYNDICATE Achievements — Official Match Archive",
    short_name: "SYNDICATE",
    description:
      "The official achievement archive of the SYNDICATE Free Fire guild — every guild-vs-guild series on record, with scores and screenshots for every game.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b0d",
    theme_color: "#0b0b0d",
    icons: [{ src: "/icon.png", sizes: "192x192", type: "image/png" }],
  };
}
