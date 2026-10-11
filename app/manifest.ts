import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Campus Buddy",
    short_name: "Campus Buddy",
    description: "Dating & friendship for Goa College of Engineering students.",
    start_url: "/explore",
    display: "standalone",
    background_color: "#fdfbf4",
    theme_color: "#fdfbf4",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
