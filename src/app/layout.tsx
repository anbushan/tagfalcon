import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import AdSenseScript from "@/components/AdSenseScript";
import GoogleAnalyticsScript from "@/components/GoogleAnalyticsScript";
import PageviewTracker from "@/components/PageviewTracker";
import FeedbackButton from "@/components/FeedbackButton";
import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: {
    default: "TagFalcon — Smart Tags. Better Insights. Grow Faster.",
    template: "%s — TagFalcon",
  },
  description:
    "Generate SEO-optimized YouTube tags, research keywords, and check video rankings with TagFalcon.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TagFalcon",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111827",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('tagfalcon_theme');
                var dark = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (dark) document.documentElement.classList.add('dark');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-white font-sans text-gray-900 antialiased dark:bg-yt-dark dark:text-gray-100">
        <AdSenseScript />
        <GoogleAnalyticsScript />
        <PWARegister />
        <Providers>
          <PageviewTracker />
          {children}
          <FeedbackButton />
        </Providers>
      </body>
    </html>
  );
}
