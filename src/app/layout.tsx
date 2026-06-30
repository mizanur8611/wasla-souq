import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/CartContext";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Wasla Souq — Food Delivery in Dubai",
  description: "One marketplace link. No surge, ever. Order food from Dubai's restaurants on Wasla Souq.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body min-h-screen bg-sand text-ink">
        <CartProvider>
          <Header />
          <main className="mx-auto max-w-5xl px-5 py-6">{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}
