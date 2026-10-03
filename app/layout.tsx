import "./globals.css";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import AppProvider from "../components/AppProvider";
import { getLocale } from "../lib/i18n/server";
import { isRtl } from "../lib/i18n/config";
import { getCurrentSessionUser } from "../lib/server/session";

const sans=localFont({src:"./fonts/plus-jakarta-sans.woff2",weight:"400 800",variable:"--font-sans",display:"swap"});
const serif=localFont({src:[{path:"./fonts/instrument-serif.woff2",style:"normal",weight:"400"},{path:"./fonts/instrument-serif-italic.woff2",style:"italic",weight:"400"}],variable:"--font-serif",display:"swap"});
const deva=localFont({src:"./fonts/noto-sans-devanagari.woff2",weight:"400 700",variable:"--font-deva",display:"swap"});

export const metadata:Metadata={title:"Sunave · Stories that stay with you",description:"Audiobooks and stories for every mood: epics, mysteries, kids' tales, classics and scripture, in English, Hindi, Arabic and Urdu."};
export const viewport:Viewport={themeColor:"#0D0B1A"};

/** Applies the saved light/dark choice before the page paints, so there is no flash. */
const themeScript=`try{var t=localStorage.getItem("sv-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default async function RootLayout({children}:{children:React.ReactNode}){
  const [locale,user]=await Promise.all([getLocale(),getCurrentSessionUser()]);
  return <html lang={locale} dir={isRtl(locale)?"rtl":"ltr"} data-theme="dark" suppressHydrationWarning className={`${sans.variable} ${serif.variable} ${deva.variable}`}>
    <head><script dangerouslySetInnerHTML={{__html:themeScript}}/></head>
    <body className="pb-[74px] min-[760px]:pb-0"><AppProvider locale={locale} user={user}>{children}</AppProvider></body>
  </html>;
}
