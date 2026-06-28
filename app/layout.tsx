import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "NPB Analytics",
  description: "日本プロ野球データ分析",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-950 text-gray-100">
        <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-white tracking-tight">
              ⚾ NPB Analytics
            </Link>
            <nav className="flex gap-6 text-sm text-gray-400">
              <Link href="/" className="hover:text-white transition-colors">チーム</Link>
              <Link href="/players" className="hover:text-white transition-colors">選手成績</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
