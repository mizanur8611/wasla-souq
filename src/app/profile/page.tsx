"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleContext";
import { MapPin, CreditCard, Globe, HelpCircle, History, User } from "lucide-react";

export default function ProfilePage() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div>
      <h1 className="mb-5 font-display text-xl font-bold text-ink">{t("profile.title")}</h1>

      <div className="mb-5 flex flex-col items-center rounded-2xl bg-paper p-6">
        <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-goldsoft text-2xl">
          <User size={26} className="text-gold" />
        </div>
        <div className="font-display text-sm font-bold text-ink">Sara A.</div>
        <div className="text-xs text-muted">sara@example.com</div>
      </div>

      <div className="space-y-2">
        <Row icon={<MapPin size={16} />} label={t("profile.addresses")} />
        <Row icon={<CreditCard size={16} />} label={t("profile.payment")} />
        <Link href="/order/history" className="block">
          <Row icon={<History size={16} />} label={t("profile.orders")} />
        </Link>
        <Row
          icon={<Globe size={16} />}
          label={t("profile.language")}
          value={locale === "en" ? "English" : "العربية"}
          onClick={() => setLocale(locale === "en" ? "ar" : "en")}
        />
        <Row icon={<HelpCircle size={16} />} label={t("profile.support")} />
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-2xl bg-paper p-4 text-left text-sm font-semibold text-ink"
    >
      <span className="flex items-center gap-3">
        <span className="text-teal">{icon}</span>
        {label}
      </span>
      {value && <span className="text-xs font-medium text-muted">{value}</span>}
    </button>
  );
}

