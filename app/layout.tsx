import "./globals.css";
import type { Metadata, Viewport } from "next";
import AppProvider from "../components/AppProvider";
import { getLocale } from "../lib/i18n/server";
import { isRtl } from "../lib/i18n/config";
import { getCurrentSessionUser } from "../lib/server/session";

export const metadata:Metadata={title:"Sacred Stories · Stories to listen to",description:"Epics, festivals, saints, adventures and timeless tales to listen to and read, in English, Hindi, Arabic and Urdu."};
export const viewport:Viewport={themeColor:"#0b0a14"};

export default async function RootLayout({children}:{children:React.ReactNode}){
  const [locale,user]=await Promise.all([getLocale(),getCurrentSessionUser()]);
  return <html lang={locale} dir={isRtl(locale)?"rtl":"ltr"}>
    <body className="pb-20 md:pb-0"><AppProvider locale={locale} user={user}>{children}</AppProvider></body>
  </html>;
}
