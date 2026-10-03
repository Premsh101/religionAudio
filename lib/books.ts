/**
 * How scripture texts are organised for reading and narration. Passages are stored one per line (Dhammapada:
 * "dhp12:3" = verse 12, line 3) or one per verse (Bible: "Genesis 1:3").
 */

/** The 26 chapters (vaggas) of the Dhammapada and the verses each one holds. */
export const DHAMMAPADA_CHAPTERS:{n:number;name:string;from:number;to:number}[]=[
  {n:1,name:"Pairs",from:1,to:20},{n:2,name:"Heedfulness",from:21,to:32},{n:3,name:"The Mind",from:33,to:43},
  {n:4,name:"Flowers",from:44,to:59},{n:5,name:"Fools",from:60,to:75},{n:6,name:"The Astute",from:76,to:89},
  {n:7,name:"The Perfected",from:90,to:99},{n:8,name:"Thousands",from:100,to:115},{n:9,name:"Wickedness",from:116,to:128},
  {n:10,name:"The Rod",from:129,to:145},{n:11,name:"Old Age",from:146,to:156},{n:12,name:"The Self",from:157,to:166},
  {n:13,name:"The World",from:167,to:178},{n:14,name:"The Buddha",from:179,to:196},{n:15,name:"Happiness",from:197,to:208},
  {n:16,name:"The Beloved",from:209,to:220},{n:17,name:"Anger",from:221,to:234},{n:18,name:"Stains",from:235,to:255},
  {n:19,name:"The Just",from:256,to:272},{n:20,name:"The Path",from:273,to:289},{n:21,name:"Miscellaneous",from:290,to:305},
  {n:22,name:"Hell",from:306,to:319},{n:23,name:"The Elephant",from:320,to:333},{n:24,name:"Craving",from:334,to:359},
  {n:25,name:"The Mendicant",from:360,to:382},{n:26,name:"The Brahmin",from:383,to:423},
];

export type PassageRef={reference:string;sequence:number};
export type Chapter={n:number;name:string|null};
export type VerseGroup<P extends PassageRef>={key:string;number:string;lines:P[]};

const DHP=/^dhp(\d+):(\d+)$/;
const BIBLE=/(\d+):(\d+)$/;

export function isDhammapada(refs:{reference:string}[]){return refs.length>0&&DHP.test(refs[0].reference)}

/** Chapter a passage belongs to. */
export function chapterOf(reference:string):number|null{
  const d=reference.match(DHP);
  if(d){const verse=Number(d[1]);return DHAMMAPADA_CHAPTERS.find(c=>verse>=c.from&&verse<=c.to)?.n??null}
  const b=reference.match(BIBLE);
  return b?Number(b[1]):null;
}

export function chapterName(reference:string,n:number):string|null{
  return DHP.test(reference)?DHAMMAPADA_CHAPTERS.find(c=>c.n===n)?.name??null:null;
}

/** Chapters present in a work, in order, with names where the text has them. */
export function chaptersOf(refs:PassageRef[]):Chapter[]{
  const seen=new Map<number,Chapter>();
  for(const r of refs){const n=chapterOf(r.reference);if(n!==null&&!seen.has(n))seen.set(n,{n,name:chapterName(r.reference,n)})}
  return [...seen.values()].sort((a,b)=>a.n-b.n);
}

/** Groups line-per-row passages into verses (Dhammapada) or keeps one verse per passage (Bible). */
export function groupVerses<P extends PassageRef>(passages:P[]):VerseGroup<P>[]{
  const groups:VerseGroup<P>[]=[];
  for(const p of passages){
    const d=p.reference.match(DHP);
    const key=d?"dhp"+d[1]:p.reference;
    const number=d?d[1]:(p.reference.match(BIBLE)?.[2]||String(p.sequence));
    const last=groups[groups.length-1];
    if(last&&last.key===key)last.lines.push(p);else groups.push({key,number,lines:[p]});
  }
  return groups;
}

/** A verse that ends mid-phrase (",", ";", ":" or nothing) is closed with a full stop so the voice settles. */
function endSentence(text:string){
  const t=text.trim().replace(/[,;:—–-]+$/,"").trim();
  return /[.!?।؟…]["'”’)]*$/.test(t)?t:t+".";
}

/**
 * Text for a whole-book narration: one paragraph per verse (Dhammapada) or per chapter (Bible), with spoken
 * chapter headings, so the reading flows instead of pausing after every printed line.
 */
export function narrationTextForWork(title:string,passages:(PassageRef&{text:string})[]){
  const out:string[]=[];
  let chapter:number|null=null;
  for(const verse of groupVerses(passages)){
    const ref=verse.lines[0].reference;
    const n=chapterOf(ref);
    if(n!==null&&n!==chapter){
      chapter=n;
      const name=chapterName(ref,n);
      out.push(name?`Chapter ${n}. ${name}.`:`${title}, chapter ${n}.`);
    }
    const text=verse.lines.map(l=>l.text.replace(/\s+/g," ").trim()).filter(Boolean).join(" ");
    if(!text)continue;
    if(DHP.test(ref))out.push(endSentence(text));
    // Bible verses of one chapter read as one flowing paragraph.
    else if(out.length&&!/^(?:.+, )?chapter \d+\.$|^Chapter \d+\./i.test(out[out.length-1]))out[out.length-1]+=" "+text;
    else out.push(text);
  }
  return out.join("\n\n");
}
