"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

/** 18+ interstitial: nothing adult is sent to the browser until the box is ticked and confirmed. */
export default function AdultGate({title}:{title?:string}){
  const router=useRouter();
  const [checked,setChecked]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  async function confirm(){
    setBusy(true);setError("");
    const res=await fetch("/api/user/adult-consent",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({confirm:checked})});
    if(res.ok){router.refresh();return}
    const data=await res.json().catch(()=>({}));
    setError(data.error||"Could not confirm.");setBusy(false);
  }
  return <section className="mx-auto max-w-xl px-5 py-16">
    <div className="rounded-3xl border border-rose-300/20 bg-rose-300/[0.04] p-8">
      <div className="flex items-center gap-3"><span className="rounded-full bg-rose-500 px-3 py-1 text-sm font-bold text-white">18+</span><ShieldAlert className="h-5 w-5 text-rose-200"/></div>
      <h1 className="mt-5 font-display text-3xl">Adult content</h1>
      {title&&<p className="mt-2 text-zinc-300">{title}</p>}
      <p className="mt-4 text-sm leading-6 text-zinc-400">This section contains mature romantic and sensual themes intended only for adults. It is kept separate from the rest of Sacred Stories and never appears in children's or family listings.</p>
      <label htmlFor="adult-confirm" className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-200">
        <input id="adult-confirm" type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)} className="mt-0.5 h-5 w-5 accent-rose-500"/>
        <span>I confirm that I am 18 years of age or older and I choose to view adult content.</span>
      </label>
      {error&&<p className="mt-3 text-sm text-rose-200">{error}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={confirm} disabled={!checked||busy} className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-40">{busy?"Confirming…":"Enter"}</button>
        <Link href="/stories" className="rounded-xl border border-white/10 px-5 py-3 text-sm text-zinc-300">Take me back</Link>
      </div>
      <p className="mt-5 text-xs text-zinc-600">Your choice is remembered on this device (and your account, if signed in). You can turn it off any time from the adult section.</p>
    </div>
  </section>;
}
