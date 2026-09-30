import Link from "next/link";
import { BookOpen, Sparkles, Headphones, ArrowRight } from "lucide-react";
import books from "../../data/catalog/books.json";
import AppHeader from "../../components/AppHeader";

export default function LibraryPage(){
  return <main className="min-h-screen bg-zinc-950">
      <AppHeader/>
    <section className="mx-auto max-w-6xl px-5 pb-20 pt-8">
      <p className="text-sm text-amber-300">Your sacred library</p>
      <h1 className="mt-2 font-display text-5xl">Read something that stays with you.</h1>
      <p className="mt-4 max-w-2xl text-zinc-400">Primary texts first. Stories and explanations around them. Every edition carries source and rights metadata.</p>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {books.map(book=><article key={book.id} className="glass rounded-3xl p-7 transition hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div className="rounded-2xl bg-white/5 p-3"><BookOpen className="h-5 w-5"/></div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-500">{book.license}</span>
          </div>
          <p className="mt-7 text-xs uppercase tracking-[0.18em] text-zinc-600">{book.tradition}</p>
          <h2 className="mt-2 font-display text-3xl">{book.title}</h2>
          <p className="mt-2 text-sm text-zinc-500">{book.edition || book.translator || book.collection}</p>
          <div className="mt-6 flex gap-3">
            {book.id==="dhp-sujato-en" && <Link href="/read/dhammapada" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"><Headphones className="h-4 w-4"/> Read + Listen</Link>}
            <a href={book.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-zinc-300">Source <ArrowRight className="h-4 w-4"/></a>
          </div>
        </article>)}
      </div>
      <div className="mt-8 rounded-3xl border border-violet-300/10 bg-violet-300/[0.04] p-7">
        <div className="flex items-center gap-2 text-violet-300"><Sparkles className="h-4 w-4"/> Growing library</div>
        <p className="mt-3 text-sm leading-6 text-zinc-500">Next ingestion lanes: Qur’an original text via Tanzil, additional SuttaCentral collections, more public-domain Sefaria editions, then permission-based and institution-partner collections.</p>
      </div>
    </section>
  </main>
}