"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Headphones, Menu, Sparkles, X } from "lucide-react";

export default function AppHeader(){
  const [open,setOpen]=useState(false);
  const [user,setUser]=useState<{displayName:string|null}|null>(null);

  useEffect(()=>{
    fetch("/api/auth/me").then(r=>r.json()).then(data=>setUser(data.user)).catch(()=>{});
  },[]);

  return <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
      <Link href="/" className="flex items-center gap-3" onClick={()=>setOpen(false)}>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-black"><BookOpen className="h-5 w-5"/></span>
        <span><span className="block font-display text-lg font-semibold leading-none">Sacred Stories</span><span className="mt-1 block text-[10px] uppercase tracking-[0.22em] text-zinc-600">Read · Listen · Explore</span></span>
      </Link>

      <nav className="hidden items-center gap-6 text-sm text-zinc-400 md:flex">
        <Link href="/stories" className="hover:text-white">Stories</Link>
        <Link href="/library" className="hover:text-white">Library</Link>
        <Link href="/places" className="hover:text-white">Places</Link>
        <Link href="/ai" className="hover:text-white">Ask AI</Link>
        <Link href="/tts" className="hover:text-white">Narration</Link>
      </nav>

      <div className="hidden items-center gap-2 md:flex">
        {user ? <Link href="/account" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5">{user.displayName || "Account"}</Link> :
          <>
            <Link href="/login" className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:text-white">Log in</Link>
            <Link href="/signup" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black">Create account</Link>
          </>}
      </div>

      <button className="rounded-xl border border-white/10 p-2 md:hidden" onClick={()=>setOpen(v=>!v)} aria-label="Toggle menu">
        {open?<X className="h-5 w-5"/>:<Menu className="h-5 w-5"/>}
      </button>
    </div>

    {open && <div className="border-t border-white/5 px-5 py-4 md:hidden">
      <div className="grid gap-2">
        {[["Stories","/stories"],["Library","/library"],["Places","/places"],["Ask AI","/ai"],["Narration","/tts"]].map(([label,href])=><Link key={href} href={href} onClick={()=>setOpen(false)} className="rounded-xl bg-white/[0.03] px-4 py-3 text-sm text-zinc-300">{label}</Link>)}
        {user ? <Link href="/account" onClick={()=>setOpen(false)} className="rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-black">Account</Link> :
          <div className="grid grid-cols-2 gap-2 pt-2"><Link href="/login" onClick={()=>setOpen(false)} className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm text-zinc-300">Log in</Link><Link href="/signup" onClick={()=>setOpen(false)} className="rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-black">Sign up</Link></div>}
      </div>
    </div>}
  </header>
}
