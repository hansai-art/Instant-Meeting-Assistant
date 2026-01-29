import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PWARegister } from "@/components/PWARegister";

export const metadata: Metadata = {
  title: "AI 會議顧問 - 即時會議助手",
  description: "主動式即時會議 AI 顧問，自動分析對話並提供策略建議",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AI 會議顧問",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a", // slate-900 for dark theme
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// export const runtime = "edge";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <head>
        <link rel="icon" href="/icons/favicon.ico" />
      </head>
      <body className="font-sans bg-slate-900 text-white antialiased">
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
