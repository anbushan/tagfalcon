"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DICTIONARIES, LOCALES, type Locale } from "@/lib/i18n/translations";

type LanguageContextValue = { locale: Locale; setLocale: (l: Locale) => void; t: (path: string) => string };

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getByPath(obj: any, path: string): any {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = localStorage.getItem("tagfalcon_locale") as Locale | null;
    if (stored && LOCALES.includes(stored)) setLocaleState(stored);
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem("tagfalcon_locale", l);
  }

  function t(path: string): string {
    const value = getByPath(DICTIONARIES[locale], path) ?? getByPath(DICTIONARIES.en, path);
    return typeof value === "string" ? value : path;
  }

  return <LanguageContext.Provider value={{ locale, setLocale, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
