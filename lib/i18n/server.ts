import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { translator } from "./messages";

/** The visitor's chosen language (cookie), else the browser's preferred one we support, else English. */
export async function getLocale():Promise<Locale>{
  const chosen=(await cookies()).get(LOCALE_COOKIE)?.value;
  if(isLocale(chosen))return chosen;
  const accepted=(await headers()).get("accept-language")||"";
  for(const part of accepted.split(",")){
    const code=part.trim().slice(0,2).toLowerCase();
    if(isLocale(code))return code;
  }
  return DEFAULT_LOCALE;
}

export async function getTranslator(){return translator(await getLocale())}
