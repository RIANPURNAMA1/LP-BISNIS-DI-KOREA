import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_SHORT_TITLE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_SHORT_TITLE,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0c2342",
    lang: "id",
    icons: [
      {
        src: "/logo.avif",
        sizes: "any",
        type: "image/avif",
      },
      {
        src: "/logo2.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
