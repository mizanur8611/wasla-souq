import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/CartContext";
import { LocaleProvider } from "@/components/LocaleContext";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Wasla Souq - Food Delivery in Dubai",
  description: "One marketplace link. No surge, ever. Order food from Dubai's restaurants on Wasla Souq.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // lang/dir start as "en"/"ltr" here and are flipped client-side by LocaleProvider
  // once it reads the saved preference, to avoid a server/client mismatch.
  return (
    <html lang="en" dir="ltr">
      <body className="font-body min-h-screen bg-sand text-ink">
        <LocaleProvider>
          <CartProvider>
            <Header />
            <main className="mx-auto max-w-5xl px-5 py-6">{children}</main>
          </CartProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}

