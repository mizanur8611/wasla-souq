"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

interface ItemDraft {
  name: string;
  price: string;
  category: string;
  description: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [cuisineTag, setCuisineTag] = useState("");
  const [heroEmoji, setHeroEmoji] = useState("🍽️");
  const [items, setItems] = useState<ItemDraft[]>([{ name: "", price: "", category: "mains", description: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function updateItem(i: number, field: keyof ItemDraft, value: string) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  }

  function addItemRow() {
    setItems((prev) => [...prev, { name: "", price: "", category: "mains", description: "" }]);
  }

  function removeItemRow(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit() {
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          cuisineTag,
          heroEmoji,
          items: items.filter((it) => it.name && it.price),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to create partner");
      setMessage("Restaurant added. ");
      router.push("/");
    } catch (e: any) {
      setMessage(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-xl font-bold text-ink">Add a restaurant</h1>
      <p className="mb-5 text-sm text-muted">
        Internal onboarding tool for Phase 0 — a real Partner Service with proper auth replaces this next.
      </p>

      <div className="space-y-3 rounded-2xl bg-paper p-4">
        <Field label="Restaurant name" value={name} onChange={setName} placeholder="e.g. Saffron & Sumac" />
        <Field label="Cuisine tag" value={cuisineTag} onChange={setCuisineTag} placeholder="e.g. Mandi · Biryani · Kabsa" />
        <Field label="Emoji icon" value={heroEmoji} onChange={setHeroEmoji} placeholder="🍽️" />
      </div>

      <h2 className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-muted">Menu items</h2>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-2xl bg-paper p-4">
            <div className="mb-2 flex justify-between">
              <span className="text-xs font-bold text-muted">Item {i + 1}</span>
              {items.length > 1 && (
                <button onClick={() => removeItemRow(i)} className="text-clay">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Name" value={item.name} onChange={(v) => updateItem(i, "name", v)} placeholder="Chicken Mandi" />
              <Field label="Price (AED)" value={item.price} onChange={(v) => updateItem(i, "price", v)} placeholder="32" />
              <Field label="Category" value={item.category} onChange={(v) => updateItem(i, "category", v)} placeholder="mains" />
              <Field label="Description" value={item.description} onChange={(v) => updateItem(i, "description", v)} placeholder="optional" />
            </div>
          </div>
        ))}
      </div>

      <button onClick={addItemRow} className="mt-3 flex items-center gap-1 text-sm font-semibold text-teal">
        <Plus size={15} /> Add another item
      </button>

      {message && <p className="mt-3 text-sm font-semibold text-clay">{message}</p>}

      <button
        onClick={submit}
        disabled={submitting || !name}
        className="mt-5 w-full rounded-2xl bg-ink py-3.5 text-center font-display text-sm font-bold text-sand disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Save restaurant"}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-sand px-3 py-2 text-sm text-ink outline-none focus:border-gold"
      />
    </label>
  );
}
