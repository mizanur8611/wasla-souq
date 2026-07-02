"use client";

import { ShieldCheck } from "lucide-react";
import { useLocale } from "./LocaleContext";

export default function HomeIntro({ hasPartners }: { hasPartners: boolean }) {
  const { t, locale, market, city } = useLocale();
  const cityName = locale === "ar" ? city.nameAr : city.name;

  return (
    <>
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-ink">{t("home.title")}</h1>
        <p className="mt-1 text-sm text-muted">
          {market.flag} {cityName} · {locale === "ar" ? "التوصيل متاح الآن" : "delivering now"}
        </p>
      </div>

      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-teal p-4 text-paper">
        <ShieldCheck size={22} className="flex-shrink-0" />
        <div>
          <div className="font-display text-sm font-bold">{t("home.trust.title")}</div>
          <div className="text-xs opacity-85">{t("home.trust.body")}</div>
        </div>
      </div>

      {!hasPartners && (
        <div className="rounded-2xl bg-paper p-6 text-center text-sm text-muted">
          {t("home.empty")} <code className="rounded bg-sanddeep px-1.5 py-0.5">npm run db:seed</code>{" "}
          {t("home.empty.or")} <a href="/admin" className="text-teal underline">/admin</a>.
        </div>
      )}
    </>
  );
}

