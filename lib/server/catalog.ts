import type { PrismaClient } from "../../generated/prisma/client";
import { audioPublicUrl } from "../audio-storage";
import { CATEGORY_KEYS, categoryOf, type CategoryKey } from "../categories";
import { asTranslations, localizeStory, textLanguages } from "../story-i18n";
import type { Locale } from "../i18n/config";

export type StoryCard={id:string;slug:string;title:string;summary:string;coverUrl:string|null;category:CategoryKey;ageMin:number|null;isNew:boolean;translated:string[];minutes:number|null;popularity:number};
export type CategoryPick={category:CategoryKey;count:number;story:StoryCard|null};

const DAY=86400000;

/** Every published, non-adult story as a card, newest first. */
export async function listStoryCards(prisma:PrismaClient|null,locale:Locale="en"):Promise<StoryCard[]>{
  if(!prisma)return [];
  const rows=await prisma.story.findMany({
    where:{status:"PUBLISHED",matureContent:false},
    orderBy:[{publishedAt:"desc"},{createdAt:"desc"}],
    take:500,
    select:{id:true,slug:true,title:true,summary:true,coverImageKey:true,collection:true,type:true,audience:true,ageMin:true,publishedAt:true,createdAt:true,translations:true},
  }).catch(()=>[]);
  // Listening time estimated from text length (about 150 words a minute); no need to load every story body.
  const lengths=await prisma.$queryRaw<{id:string;len:number}[]>`SELECT id, length(body)::int AS len FROM "Story" WHERE status='PUBLISHED' AND "matureContent"=false`.catch(()=>[]);
  const lengthById=new Map(lengths.map(l=>[l.id,Number(l.len)]));
  const since=new Date(Date.now()-30*DAY);
  const plays=await prisma.storyProgress.groupBy({by:["storyId"],where:{updatedAt:{gte:since}},_count:{_all:true}}).catch(()=>[]);
  const playsById=new Map(plays.map(p=>[p.storyId,p._count._all]));
  const now=Date.now();
  return rows.map(r=>{
    const translations=asTranslations(r.translations);
    const {title,summary}=localizeStory({title:r.title,summary:r.summary||""},translations,locale);
    return {
    id:r.id,slug:r.slug,title,summary,
    coverUrl:r.coverImageKey?audioPublicUrl(r.coverImageKey):null,
    category:categoryOf(r),ageMin:r.ageMin,
    isNew:now-(r.publishedAt||r.createdAt).getTime()<21*DAY,
    translated:textLanguages(translations),
    minutes:lengthById.get(r.id)?Math.max(1,Math.round(lengthById.get(r.id)!/870)):null,
    popularity:playsById.get(r.id)||0,
  };});
}

export function groupByCategory(cards:StoryCard[]){
  const groups=new Map<CategoryKey,StoryCard[]>();
  for(const card of cards){const list=groups.get(card.category)||[];list.push(card);groups.set(card.category,list)}
  return CATEGORY_KEYS.filter(k=>groups.has(k)).map(k=>({category:k,stories:groups.get(k)!}));
}

/**
 * One story per category for the moving hero. The pick changes daily, and stories with cover art are preferred,
 * so the hero looks fresh without anyone curating it.
 */
export function categoryPicks(cards:StoryCard[],day=Math.floor(Date.now()/DAY)):CategoryPick[]{
  return groupByCategory(cards).map(({category,stories})=>{
    const withCover=stories.filter(s=>s.coverUrl);
    const pool=withCover.length?withCover:stories;
    return {category,count:stories.length,story:pool[day%pool.length]};
  });
}
