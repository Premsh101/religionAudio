"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bookmark, BookOpen, Clock3, LogOut, UserRound } from "lucide-react";
import AppHeader from "../../components/AppHeader";

type User={id:string;displayName:string|null;email:string|null;phone:string|null};
type WorkProgress={id:string;progressPercent:number;currentSequence:number;updatedAt:string;work:{title:string;slug:string}};
type StoryProgress={id:string;progressPercent:number;currentScene:number;updatedAt:string;story:{title:string;slug:string;summary:string|null}};
type BookmarkRow={id:string;work:{title:string;slug:string}|null;story:{title:string;slug:string}|null;createdAt:string};

export default function AccountPage(){
  const [user,setUser]=useState<User|null>(null);
  const [works,setWorks]=useState<WorkProgress[]>([]);
  const [stories,setStories]=useState<StoryProgress[]>([]);
  const [bookmarks,setBookmarks]=useState<BookmarkRow[]>([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    async function load(){
      try{
        const me=await fetch("/api/auth/me").then(r=>r.json());
        setUser(me.user);
        if(!me.user) return;
        const [progressRes,bookmarkRes]=await Promise.all([
          fetch("/api/user/progress"),
          fetch("/api/user/bookmarks")
        ]);
        if(progressRes.ok){
          const data=await progressRes.json();
          setWorks(data.works||[]);
          setStories(data.stories||[]);
        }
        if(bookmarkRes.ok){
          const data=await bookmarkRes.json();
          setBookmarks(data.bookmarks||[]);
        }
      }finally{setLoading(false)}
    }
    load();
  },[]);

  async function logout(){
    await fetch("/api/auth/logout",{method:"POST"});
    window.location.href="/";
  }

  const recent=[
    ...works.map(p=>({type:"book",title:p.work.title,slug:p.work.slug,percent:p.progressPercent,sequence:p.currentSequence,updatedAt:p.updatedAt})),
    ...stories.map(p=>({type:"story",title:p.story.title,slug:p.story.slug,percent:p.progressPercent,sequence:p.currentScene,updatedAt:p.updatedAt}))
  ].sort((a,b)=>new Date(b.updatedAt).getTime()-new Date(a.updatedAt).getTime()).slice(0,6);

  return <main className="min-h-screen bg-zinc-950">
    <AppHeader/>
    <section className="mx-auto max-w-5xl px-5 py-10 md:py-14">
      {loading?<div className="glass rounded-3xl p-7 text-sm text-zinc-500">Loading your space…</div>:
      !user?<div className="glass rounded-3xl p-8"><h1 className="font-display text-3xl">Sign in to keep your place.</h1><p className="mt-3 text-sm leading-6 text-zinc-500">Your progress and bookmarks stay with your account and your self-hosted database.</p><Link href="/login" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black">Log in <ArrowRight className="h-4 w-4"/></Link></div>:
      <>
        <div className="mb-6 rounded-[32px] border border-amber-300/10 bg-gradient-to-br from-amber-300/[0.08] via-white/[0.02] to-violet-300/[0.05] p-7 md:p-9">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Your space</p>
              <h1 className="mt-2 font-display text-4xl">{user.displayName||"Reader"}</h1>
              <p className="mt-2 text-sm text-zinc-500">{user.email||user.phone}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black"><UserRound className="h-6 w-6"/></div>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-black/20 p-4"><Clock3 className="h-4 w-4 text-amber-300"/><div className="mt-3 text-2xl font-semibold">{recent.length}</div><div className="text-xs text-zinc-600">Recent items</div></div>
            <div className="rounded-2xl bg-black/20 p-4"><Bookmark className="h-4 w-4 text-violet-300"/><div className="mt-3 text-2xl font-semibold">{bookmarks.length}</div><div className="text-xs text-zinc-600">Saved</div></div>
            <div className="rounded-2xl bg-black/20 p-4"><BookOpen className="h-4 w-4 text-emerald-300"/><div className="mt-3 text-2xl font-semibold">{works.length+stories.length}</div><div className="text-xs text-zinc-600">In progress</div></div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="glass rounded-3xl p-7">
            <div className="flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.18em] text-zinc-600">Pick up where you left off</p><h2 className="mt-2 font-display text-2xl">Continue</h2></div><Link href="/library" className="text-xs text-zinc-500 hover:text-white">Library →</Link></div>
            <div className="mt-5 space-y-3">
              {recent.length===0?<p className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-sm text-zinc-500">Open a story or book and your place will appear here.</p>:
              recent.map(item=><Link key={item.type+item.slug} href={item.type==="book"&&item.slug==="dhammapada-sujato-en"?"/read/dhammapada":item.type==="story"?"/stories/"+item.slug:"/library"} className="block rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:border-white/10 hover:bg-white/[0.04]">
                <div className="flex items-center justify-between gap-3"><div><div className="text-xs uppercase tracking-[0.15em] text-zinc-600">{item.type==="book"?"Book":"Story"}</div><div className="mt-1 font-display text-lg">{item.title}</div></div><span className="text-xs text-zinc-500">{item.percent}%</span></div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-white" style={{width:String(Math.max(2,item.percent))+"%"}}/></div>
                <div className="mt-3 text-xs text-zinc-600">{item.type==="book"?"Verse":"Scene"} {item.sequence}</div>
              </Link>)}
            </div>
          </section>

          <section className="glass rounded-3xl p-7">
            <div className="flex items-center gap-2"><Bookmark className="h-4 w-4 text-violet-300"/><h2 className="font-display text-2xl">Saved</h2></div>
            <div className="mt-5 space-y-3">
              {bookmarks.length===0?<p className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-sm text-zinc-500">Save a book or story to build your personal shelf.</p>:
              bookmarks.slice(0,8).map(item=>item.work?<Link key={item.id} href={item.work.slug==="dhammapada-sujato-en"?"/read/dhammapada":"/library"} className="block rounded-2xl border border-white/5 p-4 hover:bg-white/[0.04]"><div className="text-xs text-zinc-600">Book</div><div className="mt-1 text-sm text-zinc-300">{item.work.title}</div></Link>:item.story?<Link key={item.id} href={"/stories/"+item.story.slug} className="block rounded-2xl border border-white/5 p-4 hover:bg-white/[0.04]"><div className="text-xs text-zinc-600">Story</div><div className="mt-1 text-sm text-zinc-300">{item.story.title}</div></Link>:null)}
            </div>
          </section>
        </div>

        <button onClick={logout} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-red-300/10 px-4 py-3 text-sm text-red-200"><LogOut className="h-4 w-4"/>Log out</button>
      </>}
    </section>
  </main>
}
