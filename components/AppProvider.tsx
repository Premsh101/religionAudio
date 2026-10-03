"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LOCALE_COOKIE, type Locale } from "../lib/i18n/config";
import { translator, type Translate } from "../lib/i18n/messages";
import type { SessionUser } from "../lib/auth";
import { PlayerProvider } from "./player/PlayerProvider";

export type Theme="dark"|"light";
type AppContextValue={locale:Locale;t:Translate;user:SessionUser|null;theme:Theme;toggleTheme:()=>void};
const AppContext=createContext<AppContextValue>({locale:"en",t:translator("en"),user:null,theme:"dark",toggleTheme:()=>{}});

/** Language, signed-in user and theme, plus the site-wide audio player that keeps playing between pages. */
export default function AppProvider({locale,user,children}:{locale:Locale;user:SessionUser|null;children:React.ReactNode}){
  const [theme,setTheme]=useState<Theme>("dark");
  useEffect(()=>{if(document.documentElement.getAttribute("data-theme")==="light")setTheme("light")},[]);
  const toggleTheme=useCallback(()=>{
    setTheme(prev=>{
      const next=prev==="dark"?"light":"dark";
      document.documentElement.setAttribute("data-theme",next);
      try{localStorage.setItem("sv-theme",next)}catch{}
      return next;
    });
  },[]);
  const value=useMemo(()=>({locale,t:translator(locale),user,theme,toggleTheme}),[locale,user,theme,toggleTheme]);
  return <AppContext.Provider value={value}><PlayerProvider>{children}</PlayerProvider></AppContext.Provider>;
}

export function useApp(){return useContext(AppContext)}
export function useT(){return useContext(AppContext).t}

export function setLocale(locale:Locale){
  document.cookie=`${LOCALE_COOKIE}=${locale}; path=/; max-age=${60*60*24*365}; samesite=lax`;
  window.location.reload();
}

export function isStaffRole(role?:string|null){return role==="ADMIN"||role==="EDITOR"}
