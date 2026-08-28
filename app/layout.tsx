import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://kirill-pod-partoi.vercel.app"),
  title: "Кирилл под партой: фильм",
  description: "Финальная история мультсериалов про Кирилла. Смотрите тизер фильма.",
  openGraph: {
    title: "Кирилл под партой: фильм",
    description: "Вот и настала финальная точка мультсериалов про Кирилла.",
    images: [{ url: "/Kirill-poster.jpg", width: 1706, height: 2560 }],
    type: "video.movie"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#090909"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
