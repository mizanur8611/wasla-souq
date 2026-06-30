"use client";

import Link from "next/link";
import { ShoppingCart, MapPin } from "lucide-react";
import { useCart } from "./CartContext";

export default function Header() {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-sand/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-xl font-bold text-ink">Wasla Souq</span>
          <span className="font-display text-sm text-gold" style={{ fontFamily: "var(--font-arabic, var(--font-display))" }}>
            وصلة سوق
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-1 text-sm font-medium text-ink-soft sm:flex">
            <MapPin size={15} />
            Dubai
          </div>
          <Link
            href="/cart"
            className="relative flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-sand"
          >
            <ShoppingCart size={16} />
            Cart
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[11px] font-bold text-ink">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
