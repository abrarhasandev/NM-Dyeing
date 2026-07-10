import { Geist, Geist_Mono, Inter, Roboto } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import NextAuthProvider from "@/Providers/NextAuthProvider";
import SessionWrapper from "@/components/SessionWrapper";
import "react-datepicker/dist/react-datepicker.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Figma design system fonts
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "NM | Garments Inventory Management",
    template: "%s | NM",
  },
  description: "NM is a comprehensive Garments Inventory Application designed for efficient stock tracking, order management, and real-time analytics in the apparel industry.",
  keywords: ["garments inventory", "inventory management system", "apparel stock tracking", "NM inventory"],
  authors: [{ name: "NM Team" }],
  creator: "NM",
  publisher: "NM Inc.",

  openGraph: {
    title: "NM - Garments Inventory Solution",
    description: "Streamline your garments business with our advanced inventory tracking system.",
    url: "https://yourdomain.com", 
    siteName: "NM Inventory",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NM | Garments Inventory Management",
    description: "Manage your garments production and stock effortlessly.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { cookies } from "next/headers";

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const sidebarState = cookieStore.get("sidebar_state")?.value;
  const defaultOpen = sidebarState === "false" ? false : true;

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${roboto.variable}`}>
        <NextAuthProvider>
          <SessionWrapper defaultOpen={defaultOpen}>
            {children}
            <Toaster position="bottom-right" />
          </SessionWrapper>
        </NextAuthProvider>
      </body>
    </html>
  );
}
