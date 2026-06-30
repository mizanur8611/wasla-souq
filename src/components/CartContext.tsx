"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface CartLine {
  catalogItemId: string;
  name: string;
  nameAr?: string | null;
  price: number;
  quantity: number;
}

interface CartState {
  partnerId: string | null;
  partnerName: string | null;
  lines: CartLine[];
}

interface CartContextValue extends CartState {
  addItem: (partnerId: string, partnerName: string, item: Omit<CartLine, "quantity">) => void;
  removeItem: (catalogItemId: string) => void;
  updateQty: (catalogItemId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "wasla-souq-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>({ partnerId: null, partnerName: null, lines: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {
      // ignore corrupted local storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  function addItem(partnerId: string, partnerName: string, item: Omit<CartLine, "quantity">) {
    setState((prev) => {
      // Switching restaurants clears the cart — mirrors how single-partner-cart
      // marketplaces (Talabat, Careem) behave, and keeps fulfilment simple in Phase 0.
      const sameRestaurant = prev.partnerId === null || prev.partnerId === partnerId;
      const baseLines = sameRestaurant ? prev.lines : [];
      const existing = baseLines.find((l) => l.catalogItemId === item.catalogItemId);
      const lines = existing
        ? baseLines.map((l) => (l.catalogItemId === item.catalogItemId ? { ...l, quantity: l.quantity + 1 } : l))
        : [...baseLines, { ...item, quantity: 1 }];
      return { partnerId, partnerName, lines };
    });
  }

  function removeItem(catalogItemId: string) {
    setState((prev) => {
      const lines = prev.lines.filter((l) => l.catalogItemId !== catalogItemId);
      return { ...prev, lines, partnerId: lines.length ? prev.partnerId : null, partnerName: lines.length ? prev.partnerName : null };
    });
  }

  function updateQty(catalogItemId: string, quantity: number) {
    if (quantity <= 0) return removeItem(catalogItemId);
    setState((prev) => ({
      ...prev,
      lines: prev.lines.map((l) => (l.catalogItemId === catalogItemId ? { ...l, quantity } : l)),
    }));
  }

  function clearCart() {
    setState({ partnerId: null, partnerName: null, lines: [] });
  }

  const subtotal = state.lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const itemCount = state.lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <CartContext.Provider value={{ ...state, addItem, removeItem, updateQty, clearCart, subtotal, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
