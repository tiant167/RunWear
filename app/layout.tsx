import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RunWear - Running Clothing Suggestions",
  description: "Get personalized running clothing recommendations based on weather conditions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/remixicon/4.6.0/remixicon.min.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
