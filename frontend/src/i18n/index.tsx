import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { LANGUAGES } from "./locales";
import type { LocaleCode } from "./locales";

export interface LanguageContextValue {
  code: LocaleCode;
  t: (key: string) => string;
  setCode: (code: LocaleCode) => void;
  setCodeAndPersist: (code: LocaleCode) => Promise<void>;
  supported: LocaleCode[];
  endonyms: Record<string, string>;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children, initial }: { children: ReactNode; initial?: LocaleCode }) {
  const [code, setCodeState] = useState<LocaleCode>(() => {
    if (initial && LANGUAGES[initial]) {
      return initial;
    }
    const stored = typeof window !== "undefined" ? localStorage.getItem("nexushealth.lang") : null;
    if (stored && LANGUAGES[stored as LocaleCode]) {
      return stored as LocaleCode;
    }
    return "en";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("nexushealth.lang", code);
      } catch {
        // localStorage unavailable (private mode) -> session-only switch still works
      }
      try {
        document.documentElement.lang = code;
      } catch {
        // harmless
      }
    }
  }, [code]);

  const t = useCallback(
    (key: string) => {
      const table = LANGUAGES[code] || LANGUAGES.en;
      return (table[key] as string) || LANGUAGES.en[key] || key;
    },
    [code]
  );

  const setCode = useCallback((next: LocaleCode) => {
    setCodeState(next);
  }, []);

  const setCodeAndPersist = useCallback(
    async (next: LocaleCode) => {
      setCodeState(next);
      try {
        const resp = await fetch("/api/user/language", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: next }),
        });
        if (!resp.ok) {
          throw new Error("language-persist-failed");
        }
      } catch {
        // persistence to backend is best-effort; the UI switch itself already happened
      }
    },
    []
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      code,
      t,
      setCode,
      setCodeAndPersist,
      supported: Object.keys(LANGUAGES) as LocaleCode[],
      endonyms: Object.fromEntries(Object.entries(LANGUAGES).map(([k, v]) => [k, (v as any)._endonym ?? k])),
    }),
    [code, t, setCode, setCodeAndPersist]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within <LanguageProvider>.");
  }
  return ctx;
}
