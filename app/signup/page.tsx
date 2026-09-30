"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Sparkles, UserRound } from "lucide-react";
import AppHeader from "../../components/AppHeader";

export default function SignupPage(){
  const [displayName,setDisplayName]=useState("");
  const [identifier,setIdentifier]=useState("");
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [show,setShow]=useState(false);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);

  async function submit(e:React.FormEvent){
    e.preventDefault(); setBusy(true); setError("");
    if(password!==confirm){setError("Passwords do not match.");setBusy(false);return;}
    const response=await fetch("/api/auth/signup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({displayName,identifier,password})});
    const data=await response.json();
    if(!response.ok){setError(data.error||"Could not create account.");setBusy(false);return;}
    window.location.href="/";
  }

  return <main className="min-h-screen bg-zinc-950"><AppHeader/><section className="mx-auto flex max-w-6xl justify-center px-5 py-12 md:py-16"><div className="w-full max-w-md"><div className="mb-8 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-300 text-black"><UserRound className="h-6 w-6"/></div><h1 className="mt-6 font-display text-4xl">Create your account</h1><p className="mt-2 text-sm text-zinc-500">Use an email address or phone number and a password.</p></div><form onSubmit={submit} className="glass rounded-3xl p-6 md:p-8"><label className="block text-sm text-zinc-300">Name <span className="text-zinc-600">(optional)</span><input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="What should we call you?" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm outline-none"/></label><label className="mt-5 block text-sm text-zinc-300">Email address or phone number<input required value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="you@example.com or +91 98765 43210" autoComplete="username" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm outline-none"/></label><label className="mt-5 block text-sm text-zinc-300">Password<div className="mt-2 flex items-center rounded-xl border border-white/10 bg-black/20"><input required minLength={8} type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" className="w-full bg-transparent px-4 py-3.5 text-sm outline-none"/><button type="button" onClick={()=>setShow(v=>!v)} className="px-4 text-zinc-500">{show?<EyeOff className="h-4 w-4"/>:<Eye className="h-4 w-4"/>}</button></div><span className="mt-1 block text-xs text-zinc-600">At least 8 characters.</span></label><label className="mt-5 block text-sm text-zinc-300">Confirm password<input required minLength={8} type={show?"text":"password"} value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="new-password" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm outline-none"/></label>{error&&<div className="mt-4 rounded-xl border border-red-300/10 bg-red-300/[0.05] px-4 py-3 text-sm text-red-200">{error}</div>}<button disabled={busy} className="mt-6 w-full rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-black disabled:opacity-50">{busy?"Creating account…":"Create account"}</button><p className="mt-5 text-center text-sm text-zinc-500">Already have an account? <Link href="/login" className="text-white hover:underline">Log in</Link></p></form><div className="mt-5 flex items-center justify-center gap-2 text-xs text-zinc-600"><Sparkles className="h-3.5 w-3.5"/>Your email/phone is used only as your login identifier.</div></div></section></main>
}
