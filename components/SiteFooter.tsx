"use client";
import Link from "next/link";
import SunaveLogo from "./SunaveLogo";
import { useApp } from "./AppProvider";

export default function SiteFooter(){
  const {t,user}=useApp();
  const col="flex flex-col gap-2 text-sm";
  return <footer className="mt-16 border-t border-line bg-bg2">
    <div className="container-site flex flex-col gap-8 py-12 min-[760px]:flex-row min-[760px]:justify-between">
      <div><SunaveLogo size={30}/><p className="mt-4 text-sm text-mut">{t("footer.line")}</p></div>
      <div className="flex gap-14">
        <nav className={col}><span className="font-extrabold text-ink">{t("footer.explore")}</span>
          <Link href="/stories" className="text-mut hover:text-ink">{t("nav.browse")}</Link>
          <Link href="/library" className="text-mut hover:text-ink">{t("nav.library")}</Link>
          <Link href="/search" className="text-mut hover:text-ink">{t("nav.search")}</Link>
        </nav>
        <nav className={col}><span className="font-extrabold text-ink">{t("footer.account")}</span>
          {user?<><Link href="/account" className="text-mut hover:text-ink">{t("nav.settings")}</Link><Link href="/history" className="text-mut hover:text-ink">{t("nav.history")}</Link></>
          :<><Link href="/login" className="text-mut hover:text-ink">{t("nav.login")}</Link><Link href="/signup" className="text-mut hover:text-ink">{t("footer.signup")}</Link></>}
        </nav>
      </div>
    </div>
    <p className="pb-8 text-center text-xs text-mut2">© {new Date().getFullYear()} Sunave · sunave.tech</p>
  </footer>;
}
