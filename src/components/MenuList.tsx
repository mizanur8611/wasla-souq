"use client";

import { useCart } from "./CartContext";
import { useLocale } from "./LocaleContext";
import { Plus } from "lucide-react";

interface Item {
  id: string;
  name: string;
  nameAr?: string | null;
  description?: string | null;
  price: number;
  category: string;
}

export default function MenuList({
  partnerId,
  partnerName,
  items,
  currency,
}: {
  partnerId: string;
  partnerName: string;
  items: Item[];
  currency: string;
}) {
  const { addItem } = useCart();
  const { locale, t } = useLocale();

  const categories = Array.from(new Set(items.map((i) => i.category)));

  function categoryLabel(cat: string) {
    const key = `category.${cat}`;
    const translated = t(key);
    return translated === key ? cat : translated;
  }

  return (
    <div className="space-y-5">
      {categories.map((cat) => (
        <div key={cat}>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{categoryLabel(cat)}</h3>
          <div className="space-y-2">
            {items
              .filter((i) => i.category === cat)
              .map((item) => {
                const displayName = locale === "ar" && item.nameAr ? item.nameAr : item.name;
                return (
                  <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-paper p-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-ink">{displayName}</div>
                      {item.description && <div className="mt-0.5 text-xs text-muted">{item.description}</div>}
                      <div className="mt-1 font-mono text-xs font-semibold text-teal">
                        {currency} {item.price.toFixed(2)}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        addItem(partnerId, partnerName, {
                          catalogItemId: item.id,
                          name: item.name,
                          nameAr: item.nameAr,
                          price: item.price,
                        })
                      }
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-sanddeep text-ink transition hover:bg-gold"
                      aria-label={`${t("menu.add")} ${displayName}`}
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

