import { I18n } from "i18n-js";
import { en } from "./en";
import { he } from "./he";

export const translations = {
    en: en,
    he: he,
}

export const i18n = new I18n(translations);