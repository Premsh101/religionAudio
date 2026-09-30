"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppHeader from "../../components/AppHeader";
import { ArrowRight, LogOut, UserRound } from "lucide-react";

type User={id:string;displayName:string|null;email:string|null;phone:string|null};

export default function AccountPage(){
  const [user,setUser]=useState<User|null>(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    fetch("/api/auth/me").then(r=>r.json()).then(data=>setUser(data.user)).finally(()=>setLoading(false));
  },[]);

  async function logout(){
    await fetch("/api/auth/logout",{method:"POST"});
    window.location.href="/";
  }

  return <main className="min-h-screen bg-zinc-950">
    <AppHeader/>
    <section className="mx-auto max-w-3xl px-5 py-12 md:py-16">
      <div className="mb-6 rounded-3xl border border-amber-300/10 bg-amber-300/[0.04] p-6"><p className="text-xs uppercase tracking-[0.18em] text-amber-300">Your space</p><h1 className="mt-2 font-display text-4xl">Keep the stories you love close.</h1><p className="mt-2 text-sm text-zinc-500">Your account will eventually hold listening progress, bookmarks, notes and family profiles.</p></div>
      {loading?<div className="glass rounded-3xl p-7 text-sm text-zinc-500">Loading your account…</div>:
      user?<div className="glass rounded-3xl p-7"><div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black"><UserRound className="h-6 w-6"/></div><div><div className="font-display text-2xl">{user.displayName||"Reader"}</div><div className="mt-1 text-sm text-zinc-500">{user.email||user.phone}</div></div></div><div className="mt-8 grid gap-3 sm:grid-cols-2"><Link href="/stories" className="rounded-2xl border border-white/10 p-5 text-sm text-zinc-300 hover:bg-white/5">Continue exploring <ArrowRight className="ml-1 inline h-4 w-4"/></Link><Link href="/library" className="rounded-2xl border border-white/10 p-5 text-sm text-zinc-300 hover:bg-white/5">Open library <ArrowRight className="ml-1 inline h-4 w-4"/></Link></div><button onClick={logout} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-red-300/10 px-4 py-3 text-sm text-red-200"><LogOut className="h-4 w-4"/>Log out</button></div>:
      <div className="glass rounded-3xl p-7"><h2 className="font-display text-2xl">You are not signed in.</h2><p className="mt-2 text-sm text-zinc-500">Log in to save your progress and build your personal library.</p><Link href="/login" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black">Log in <ArrowRight className="h-4 w-4"/></Link></div>}
    </section>
  </main>
}
