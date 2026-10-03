"use client";

/** 72-bar waveform; bars before the playhead use the sun→coral gradient. Click or tap to seek. */
export default function Waveform({seed,progress,onSeek,bars=72,height=56,label}:{seed:string;progress:number;onSeek?:(fraction:number)=>void;bars?:number;height?:number;label?:string}){
  const heights=Array.from({length:bars},(_,i)=>{
    let h=0;const key=seed+i;for(let k=0;k<key.length;k++)h=(h*33+key.charCodeAt(k))>>>0;
    return 0.25+((h%1000)/1000)*0.75;
  });
  const played=Math.round(Math.min(1,Math.max(0,progress))*bars);
  return <div role={onSeek?"slider":undefined} aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress*100)} tabIndex={onSeek?0:undefined}
    onKeyDown={e=>{if(!onSeek)return;if(e.key==="ArrowRight")onSeek(Math.min(1,progress+0.02));if(e.key==="ArrowLeft")onSeek(Math.max(0,progress-0.02))}}
    onClick={e=>{if(!onSeek)return;const r=e.currentTarget.getBoundingClientRect();const x=(e.clientX-r.left)/r.width;onSeek(document.dir==="rtl"?1-x:x)}}
    className={"flex w-full items-center gap-[3px] "+(onSeek?"cursor-pointer":"")} style={{height}} dir="ltr">
    {heights.map((h,i)=><span key={i} className="flex-1 rounded-full" style={{height:`${h*100}%`,background:i<played?"linear-gradient(180deg,#FFB020,#FF5A5F)":"var(--line2)"}}/>)}
  </div>;
}
