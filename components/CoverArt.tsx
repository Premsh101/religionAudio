/* eslint-disable @next/next/no-img-element */
import { BookOpen, Ghost, ScrollText, Sparkles } from "lucide-react";

const tints:Record<string,string>={
  "ghost story":"from-violet-700 via-fuchsia-900 to-zinc-950",
  mythology:"from-amber-600 via-orange-900 to-zinc-950",
  folklore:"from-emerald-700 via-teal-900 to-zinc-950",
  "moral tale":"from-rose-600 via-pink-900 to-zinc-950",
};

/**
 * Book-cover tile. The title is set in type over the artwork (the generated art leaves the top third
 * clear for it), so it stays sharp, editable and correct in every script.
 */
export default function CoverArt({title,tag,kind,coverUrl,size="md"}:{title:string;tag:string;kind:"story"|"work";coverUrl?:string|null;size?:"sm"|"md"|"lg"}){
  const t=tag.toLowerCase();
  const tint=tints[t]||(kind==="work"?"from-indigo-700 via-blue-950 to-zinc-950":"from-sky-700 via-cyan-950 to-zinc-950");
  const Icon=kind==="work"?ScrollText:t.includes("ghost")?Ghost:t.includes("myth")?Sparkles:BookOpen;
  const titleSize=size==="lg"?"text-3xl md:text-4xl":size==="sm"?"text-sm":"text-lg";
  return <div className={`relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b ${tint} shadow-xl`}>
    {coverUrl?<img src={coverUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover"/>:<Icon className="absolute bottom-[18%] left-1/2 h-1/4 w-1/4 -translate-x-1/2 text-white/15"/>}
    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-black/75 via-black/30 to-transparent"/>
    <div className="absolute inset-x-0 top-0 p-[8%] text-center">
      <p className={`font-display font-semibold leading-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,.6)] ${titleSize}`} style={{textWrap:"balance"} as React.CSSProperties}>{title}</p>
      {size!=="sm"&&<p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-white/70">{tag}</p>}
    </div>
  </div>;
}
