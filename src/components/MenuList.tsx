"use client";

import { useState } from "react";
import { useCart } from "./CartContext";
import { useLocale } from "./LocaleContext";
import { Plus, Minus, X, ShoppingCart } from "lucide-react";

interface Item {
  id: string;
  name: string;
  nameAr?: string | null;
  description?: string | null;
  price: number;
  category: string;
  imageUrl?: string | null;
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
  const { locale, t, fmt } = useLocale();
  const [selected, setSelected] = useState<Item | null>(null);
  const [qty, setQty] = useState(1);

  const categories = Array.from(new Set(items.map((i) => i.category)));

  function categoryLabel(cat: string) {
    const key = `category.${cat}`;
    const translated = t(key);
    return translated === key ? cat : translated;
  }

  function openPopup(item: Item) {
    setSelected(item);
    setQty(1);
  }

  function closePopup() {
    setSelected(null);
    setQty(1);
  }

  function confirmAdd() {
    if (!selected) return;
    for (let i = 0; i < qty; i++) {
      addItem(partnerId, partnerName, {
        catalogItemId: selected.id,
        name: selected.name,
        nameAr: selected.nameAr,
        price: selected.price,
      });
    }
    closePopup();
  }

  return (
    <>
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
                    <div
                      key={item.id}
                      onClick={() => openPopup(item)}
                      className="flex cursor-pointer items-center gap-3 rounded-2xl bg-paper p-3 transition hover:shadow-sm"
                    >
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt={displayName} className="h-14 w-14 flex-shrink-0 rounded-xl object-cover" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-ink">{displayName}</div>
                        {item.description && (
                          <div className="mt-0.5 line-clamp-2 text-xs text-muted">{item.description}</div>
                        )}
                        <div className="mt-1 font-mono text-xs font-semibold text-teal">{fmt(item.price)}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addItem(partnerId, partnerName, {
                            catalogItemId: item.id,
                            name: item.name,
                            nameAr: item.nameAr,
                            price: item.price,
                          });
                        }}
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

      {/* Item detail popup */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center"
          onClick={closePopup}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-paper pb-8 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {selected.imageUrl && (
              <img
                src={selected.imageUrl}
                alt={locale === "ar" && selected.nameAr ? selected.nameAr : selected.name}
                className="h-48 w-full rounded-t-3xl object-cover sm:rounded-t-3xl"
              />
            )}

            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 pe-3">
                  <h2 className="font-display text-lg font-bold text-ink">
                    {locale === "ar" && selected.nameAr ? selected.nameAr : selected.name}
                  </h2>
                  {selected.description && (
                    <p className="mt-1 text-sm text-muted">{selected.description}</p>
                  )}
                </div>
                <button
                  onClick={closePopup}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-sanddeep text-ink"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="font-display text-xl font-bold text-ink">{fmt(selected.price)}</div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-sanddeep text-ink"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-6 text-center font-bold text-ink">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-sanddeep text-ink"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <button
                onClick={confirmAdd}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 font-display text-sm font-bold text-sand"
              >
                <ShoppingCart size={16} />
                {t("menu.add")} · {fmt(selected.price * qty)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

