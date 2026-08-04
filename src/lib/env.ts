/**
 * True only for the actual production deployment. Vercel sets VERCEL_ENV to
 * "production" solely for the deployment tied to the production domain —
 * preview/dev deployments get "preview" or "development". Used to keep
 * Google (and other crawlers) from indexing dev/preview URLs.
 */
export function isProductionDeployment(): boolean {
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV === "production";
  return process.env.NODE_ENV === "production";
}
