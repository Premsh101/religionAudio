import type { PrismaClient } from "../../generated/prisma/client";

export type ItemKind="story"|"work";
export type FeedItem={
  kind:ItemKind;id:string;slug:string;title:string;subtitle:string;tag:string;href:string;
  createdAt:string;isNew:boolean;progressPercent?:number;updatedAt?:string;reason?:string;
};
export type HistoryEntry={kind:ItemKind;id:string;progressPercent:number;completed?:boolean;updatedAt:string};

const NEW_DAYS=21;
const DAY=86400000;

type Candidate=FeedItem&{features:string[];popularity:number};

const typeTag:Record<string,string>={STORY:"Story",MYTHOLOGY:"Mythology",FOLKLORE:"Folklore",GHOST_STORY:"Ghost story",MORAL_TALE:"Moral tale",SCRIPTURE:"Scripture",BIOGRAPHY:"Biography"};

async function loadCandidates(prisma:PrismaClient):Promise<Candidate[]>{
  const since=new Date(Date.now()-30*DAY);
  const [stories,works,storyPlays,workPlays,audioPlays]=await Promise.all([
    prisma.story.findMany({where:{status:"PUBLISHED"},select:{id:true,slug:true,title:true,summary:true,type:true,audience:true,narrationProfile:true,language:true,religionId:true,traditionId:true,createdAt:true,publishedAt:true,religion:{select:{name:true}}}}),
    prisma.work.findMany({select:{id:true,slug:true,title:true,edition:true,translator:true,language:true,religionId:true,traditionId:true,createdAt:true,religion:{select:{name:true}}}}),
    prisma.storyProgress.groupBy({by:["storyId"],where:{updatedAt:{gte:since}},_count:{_all:true}}),
    prisma.workProgress.groupBy({by:["workId"],where:{updatedAt:{gte:since}},_count:{_all:true}}),
    prisma.audioPlaybackProgress.findMany({where:{updatedAt:{gte:since}},select:{audioAsset:{select:{storyId:true,workId:true}}}})
  ]);
  const plays=new Map<string,number>();
  const bump=(key:string,n=1)=>plays.set(key,(plays.get(key)||0)+n);
  storyPlays.forEach(r=>bump("story:"+r.storyId,r._count._all));
  workPlays.forEach(r=>bump("work:"+r.workId,r._count._all));
  audioPlays.forEach(r=>{if(r.audioAsset.storyId)bump("story:"+r.audioAsset.storyId);if(r.audioAsset.workId)bump("work:"+r.audioAsset.workId)});
  const now=Date.now();
  return [
    ...stories.map(s=>{
      const added=(s.publishedAt||s.createdAt);
      return {
        kind:"story" as const,id:s.id,slug:s.slug,title:s.title,subtitle:s.summary||"",tag:typeTag[s.type]||"Story",href:"/stories/"+s.slug,
        createdAt:added.toISOString(),isNew:now-added.getTime()<NEW_DAYS*DAY,
        features:["kind:story","type:"+s.type,"aud:"+s.audience,"prof:"+s.narrationProfile,"lang:"+s.language,s.religionId?"rel:"+s.religionId:"",s.traditionId?"trad:"+s.traditionId:""].filter(Boolean),
        popularity:plays.get("story:"+s.id)||0
      };
    }),
    ...works.map(w=>({
      kind:"work" as const,id:w.id,slug:w.slug,title:w.title,subtitle:w.edition||w.translator||"Primary text",tag:w.religion?.name||"Scripture",href:"/read/"+w.slug,
      createdAt:w.createdAt.toISOString(),isNew:now-w.createdAt.getTime()<NEW_DAYS*DAY,
      features:["kind:work","type:SCRIPTURE","lang:"+w.language.toLowerCase(),w.religionId?"rel:"+w.religionId:"",w.traditionId?"trad:"+w.traditionId:""].filter(Boolean),
      popularity:plays.get("work:"+w.id)||0
    }))
  ];
}

const strip=({features,popularity,...item}:Candidate):FeedItem=>item;
const keyOf=(e:{kind:string;id:string})=>e.kind+":"+e.id;

/** Signed-in history from reading progress and audio playback, newest first. */
export async function loadUserHistory(prisma:PrismaClient,userId:string):Promise<HistoryEntry[]>{
  const [works,stories,audio]=await Promise.all([
    prisma.workProgress.findMany({where:{userId},orderBy:{updatedAt:"desc"},take:100,select:{workId:true,progressPercent:true,completedAt:true,updatedAt:true}}),
    prisma.storyProgress.findMany({where:{userId},orderBy:{updatedAt:"desc"},take:100,select:{storyId:true,progressPercent:true,completedAt:true,updatedAt:true}}),
    prisma.audioPlaybackProgress.findMany({where:{userId},orderBy:{updatedAt:"desc"},take:100,select:{progressPercent:true,completedAt:true,updatedAt:true,audioAsset:{select:{storyId:true,workId:true}}}})
  ]);
  const entries:HistoryEntry[]=[
    ...works.map(w=>({kind:"work" as const,id:w.workId,progressPercent:w.progressPercent,completed:Boolean(w.completedAt),updatedAt:w.updatedAt.toISOString()})),
    ...stories.map(s=>({kind:"story" as const,id:s.storyId,progressPercent:s.progressPercent,completed:Boolean(s.completedAt),updatedAt:s.updatedAt.toISOString()})),
    ...audio.flatMap(a=>{
      const target=a.audioAsset.storyId?{kind:"story" as const,id:a.audioAsset.storyId}:a.audioAsset.workId?{kind:"work" as const,id:a.audioAsset.workId}:null;
      return target?[{...target,progressPercent:a.progressPercent,completed:Boolean(a.completedAt),updatedAt:a.updatedAt.toISOString()}]:[];
    })
  ];
  return mergeHistory(entries);
}

/** One entry per item: latest activity time, furthest progress. */
export function mergeHistory(entries:HistoryEntry[]):HistoryEntry[]{
  const map=new Map<string,HistoryEntry>();
  for(const e of entries){
    const prev=map.get(keyOf(e));
    if(!prev){map.set(keyOf(e),{...e});continue}
    map.set(keyOf(e),{
      kind:e.kind,id:e.id,
      progressPercent:Math.max(prev.progressPercent,e.progressPercent),
      completed:Boolean(prev.completed||e.completed),
      updatedAt:prev.updatedAt>e.updatedAt?prev.updatedAt:e.updatedAt
    });
  }
  return [...map.values()].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
}

export async function getNewArrivals(prisma:PrismaClient,limit=6):Promise<FeedItem[]>{
  const candidates=await loadCandidates(prisma);
  return candidates.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,limit).map(strip);
}

/**
 * Content-based recommendations: every item in the listener's history adds weight to its features
 * (genre, audience, narration style, tradition, language), more for recent and further-progressed items.
 * Unplayed items are scored against that taste profile, with a small boost for popular and new items.
 */
export async function getHomeFeed(prisma:PrismaClient,history:HistoryEntry[]){
  const candidates=await loadCandidates(prisma);
  const byKey=new Map(candidates.map(c=>[keyOf(c),c]));
  const known=mergeHistory(history).filter(h=>byKey.has(keyOf(h)));
  const seen=new Set(known.map(keyOf));
  const now=Date.now();

  const continueItems=known
    .filter(h=>!h.completed&&h.progressPercent<100)
    .slice(0,10)
    .map(h=>({...strip(byKey.get(keyOf(h))!),progressPercent:h.progressPercent,updatedAt:h.updatedAt}));

  const taste=new Map<string,number>();
  for(const h of known){
    const days=Math.max(0,(now-new Date(h.updatedAt).getTime())/DAY);
    const weight=Math.pow(0.5,days/14)*(0.5+Math.min(100,h.progressPercent)/100);
    for(const f of byKey.get(keyOf(h))!.features)taste.set(f,(taste.get(f)||0)+weight);
  }
  const maxPop=Math.max(1,...candidates.map(c=>c.popularity));
  const score=(c:Candidate)=>c.features.reduce((sum,f)=>sum+(taste.get(f)||0),0)+0.6*(c.popularity/maxPop)+(c.isNew?0.3:0);
  const unseen=candidates.filter(c=>!seen.has(keyOf(c)));

  const recommended=unseen
    .map(c=>({c,s:score(c)}))
    .sort((a,b)=>b.s-a.s||b.c.createdAt.localeCompare(a.c.createdAt))
    .slice(0,12)
    .map(({c})=>({...strip(c),reason:known.length?"Matches what you listen to":c.isNew?"New on Sacred Stories":"Popular with listeners"}));

  let becauseYou:{seed:FeedItem;items:FeedItem[]}|null=null;
  const seed=known[0]&&byKey.get(keyOf(known[0]));
  if(seed){
    const seedFeatures=new Set(seed.features.filter(f=>!f.startsWith("lang:")));
    const items=unseen
      .map(c=>({c,overlap:c.features.filter(f=>seedFeatures.has(f)).length}))
      .filter(x=>x.overlap>1)
      .sort((a,b)=>b.overlap-a.overlap||b.c.popularity-a.c.popularity)
      .slice(0,8)
      .map(({c})=>strip(c));
    if(items.length)becauseYou={seed:strip(seed),items};
  }

  const popular=candidates.filter(c=>c.popularity>0).sort((a,b)=>b.popularity-a.popularity).slice(0,10).map(strip);
  const newArrivals=[...candidates].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,10).map(strip);
  return {continueItems,recommended,becauseYou,popular,newArrivals};
}

/** Hydrates history entries with titles/links for the history page. */
export async function describeHistory(prisma:PrismaClient,history:HistoryEntry[]){
  const candidates=await loadCandidates(prisma);
  const byKey=new Map(candidates.map(c=>[keyOf(c),c]));
  return mergeHistory(history).flatMap(h=>{
    const c=byKey.get(keyOf(h));
    return c?[{...strip(c),progressPercent:h.progressPercent,completed:Boolean(h.completed),updatedAt:h.updatedAt}]:[];
  });
}
