import { MetadataRoute } from "next";
import { isProductionDeployment } from "@/lib/env";

const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  // Preview/dev deployments block everything — only the production domain
  // should ever be crawled or show up in search results.
  if (!isProductionDeployment()) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/app", "/admin", "/api/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
