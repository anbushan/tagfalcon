import Link from "next/link";
import HeroCTA from "./HeroCTA";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t dark:border-gray-800">
      <div className="mx-auto max-w-5xl px-6 py-16 text-center">
        <h2 className="text-2xl font-semibold">Ready to grow your channel?</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">No card required. Start with the free plan today.</p>
        <div className="mt-6 flex justify-center">
          <HeroCTA />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-12">
        <div className="grid grid-cols-2 gap-8 border-t pt-10 text-sm dark:border-gray-800 sm:grid-cols-4">
          <div>
            <p className="font-medium">Product</p>
            <ul className="mt-3 space-y-2 text-gray-600 dark:text-gray-400">
              <li><Link href="/app/generator">Tag generator</Link></li>
              <li><Link href="/app/research/keywords">Keyword research</Link></li>
              <li><Link href="/app/video-rankings">Rank checker</Link></li>
              <li><Link href="/pricing">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Company</p>
            <ul className="mt-3 space-y-2 text-gray-600 dark:text-gray-400">
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/blog">Blog</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Legal</p>
            <ul className="mt-3 space-y-2 text-gray-600 dark:text-gray-400">
              <li><Link href="/legal/terms">Terms & conditions</Link></li>
              <li><Link href="/legal/privacy">Privacy policy</Link></li>
              <li><Link href="/legal/cookies">Cookies policy</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-medium">Resources</p>
            <ul className="mt-3 space-y-2 text-gray-600 dark:text-gray-400">
              <li><a href="/sitemap.xml">Sitemap</a></li>
              <li><a href="/robots.txt">Robots.txt</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <Logo size="text-base" markSize={20} />
          <p className="text-xs text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} TagFalcon. All rights reserved.
          </p>
        </div>
        <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500 sm:text-left">
          Public video and channel data is sourced from the YouTube API. TagFalcon is not affiliated with or
          endorsed by YouTube.
        </p>
      </div>
    </footer>
  );
}
