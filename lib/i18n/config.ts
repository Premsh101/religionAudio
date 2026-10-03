export const LOCALES=["en","hi","ar","ur"] as const;
export type Locale=typeof LOCALES[number];
export const DEFAULT_LOCALE:Locale="en";
export const LOCALE_COOKIE="ra_lang";
/** Each language is always shown in its own script, so people can find theirs whatever is selected. */
export const LOCALE_NAMES:Record<Locale,string>={en:"English",hi:"हिन्दी",ar:"العربية",ur:"اردو"};
export const LOCALE_SHORT:Record<Locale,string>={en:"EN",hi:"हि",ar:"ع",ur:"اُ"};
export function isLocale(value:unknown):value is Locale{return typeof value==="string"&&(LOCALES as readonly string[]).includes(value)}
export function isRtl(locale:Locale){return locale==="ar"||locale==="ur"}
