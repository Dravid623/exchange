import type { Metadata } from "next";
import "./globals.css";
import { MainHeader } from "./components/MainHeader";

export const metadata: Metadata = {
  title: "NSE Exchange",
  description: "NSE Exchange",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
      >
          <MainHeader />
          {children}
      </body>
    </html>
  );
}
