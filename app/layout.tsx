import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CallCenter Pro",
  description: "Twilio-powered call center management dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
