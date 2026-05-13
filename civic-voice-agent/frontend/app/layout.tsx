import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "civic-voice-agent",
  description: "Upload, detect, and ask about civic incidents.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
