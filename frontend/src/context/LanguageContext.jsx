import { createContext, useContext, useEffect, useState } from "react";
import { translations } from "../i18n/translations";
import { applyPageLanguage, pageTranslations } from "../i18n/pageTranslations";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem("kq_lang") || "en");

  useEffect(() => {
    applyPageLanguage(lang);
    const observer = new MutationObserver(() => applyPageLanguage(lang));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [lang]);

  function toggleLang() {
    const next = lang === "en" ? "hi" : "en";
    localStorage.setItem("kq_lang", next);
    setLang(next);
  }

  function setLanguage(next) {
    if (next !== "en" && next !== "hi") return;
    localStorage.setItem("kq_lang", next);
    setLang(next);
  }

  function t(key) {
    return translations[lang]?.[key] || translations.en[key] || pageTranslations[lang]?.[key] || pageTranslations.en[key] || key;
  }

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
