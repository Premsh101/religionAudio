"use client";

import { createContext, useContext, useMemo } from "react";
import { LOCALE_COOKIE, type Locale } from "../lib/i18n/config";
import { translator, type Translate } from "../lib/i18n/messages";
import type { SessionUser } from "../lib/auth";

type AppContextValue={locale:Locale;t:Translate;user:SessionUser|null};
const AppContext=createContext<AppContextValue>({locale:"en",t:translator("en"),user:null});

/** Language and signed-in user, resolved on the server so pages render in the right language without a flash. */
export default function AppProvider({locale,user,children}:{locale:Locale;user:SessionUser|null;children:React.ReactNode}){
  const value=useMemo(()=>({locale,t:translator(locale),user}),[locale,user]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(){return useContext(AppContext)}
export function useT(){return useContext(AppContext).t}

export function setLocale(locale:Locale){
  document.cookie=`${LOCALE_COOKIE}=${locale}; path=/; max-age=${60*60*24*365}; samesite=lax`;
  window.location.reload();
}

export function isStaffRole(role?:string|null){return role==="ADMIN"||role==="EDITOR"}
