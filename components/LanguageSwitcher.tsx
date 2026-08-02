"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n/translations";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as any)}
      className="rounded-md border bg-white px-2 py-1.5 text-xs sm:text-sm"
      aria-label="Language"
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>
          {LOCALE_LABELS[l]}
        </option>
      ))}
    </select>
  );
}
