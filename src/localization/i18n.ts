import { I18n } from "i18n-js";
import { en } from "./en";
import { he } from "./he";
import { es } from "./es";
import { ar } from "./ar";

export const translations = {
    en: en,
    he: he,
    es: es,
    ar: ar,
}

export const i18n = new I18n(translations);