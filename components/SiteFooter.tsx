"use client";
import Link from "next/link";
import { Logo } from "./AppHeader";
import { useT } from "./AppProvider";

export default function SiteFooter(){
  const t=useT();
  return <footer className="mt-10 border-t border-white/[0.06]">
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-8">
      <div><Logo/><p className="mt-3 text-sm text-zinc-500">{t("footer.line")}</p></div>
      <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-400">
        <Link href="/stories" className="hover:text-white">{t("nav.stories")}</Link>
        <Link href="/library" className="hover:text-white">{t("nav.library")}</Link>
        <Link href="/search" className="hover:text-white">{t("nav.search")}</Link>
        <Link href="/account" className="hover:text-white">{t("nav.settings")}</Link>
      </nav>
    </div>
    <p className="pb-8 text-center text-xs text-zinc-600">© {new Date().getFullYear()} {t("brand.name")}</p>
  </footer>;
}
