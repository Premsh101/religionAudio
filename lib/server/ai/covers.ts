import type { PrismaClient } from "../../../generated/prisma/client";
import { audioPublicUrl, storeAudioAt } from "../../audio-storage";
import { generateImage, Type } from "./vertex";
import { chatJson } from "./text";

export type CatalogKind="story"|"work";

type Content={kind:CatalogKind;id:string;title:string;genre:string;audience:string;language:string;tradition:string;excerpt:string;existingSummary:string};

const EXCERPT_CHARS=6000;

export async function loadContent(prisma:PrismaClient,kind:CatalogKind,id:string):Promise<Content>{
  if(kind==="story"){
    const s=await prisma.story.findUnique({where:{id},select:{id:true,title:true,type:true,audience:true,language:true,summary:true,body:true,religion:{select:{name:true}},tradition:{select:{name:true}},scenes:{orderBy:{sequence:"asc"},select:{text:true},take:40}}});
    if(!s)throw new Error("Story not found.");
    const text=s.scenes.map(x=>x.text).join("\n\n")||s.body;
    return {kind,id,title:s.title,genre:s.type.replace(/_/g," ").toLowerCase(),audience:s.audience.toLowerCase(),language:s.language,tradition:[s.religion?.name,s.tradition?.name].filter(Boolean).join(" / "),excerpt:text.slice(0,EXCERPT_CHARS),existingSummary:s.summary||""};
  }
  const w=await prisma.work.findUnique({where:{id},select:{id:true,title:true,language:true,summary:true,edition:true,religion:{select:{name:true}},tradition:{select:{name:true}},passages:{orderBy:{sequence:"asc"},select:{text:true},take:80}}});
  if(!w)throw new Error("Book not found.");
  return {kind,id,title:w.title,genre:"sacred scripture",audience:"all ages",language:w.language,tradition:[w.religion?.name,w.tradition?.name].filter(Boolean).join(" / "),excerpt:w.passages.map(p=>p.text).join("\n").slice(0,EXCERPT_CHARS),existingSummary:w.summary||w.edition||""};
}

/** Titles that look like ids, slugs or placeholders should be replaced with a real name. */
export function needsTitle(title:string){
  const t=title.trim();
  return !t||/^untitled/i.test(t)||/[_]/.test(t)||/^[a-z0-9-]+$/.test(t)&&t.includes("-")||/^(story|book|chapter|draft)\s*\d*$/i.test(t);
}

function describe(c:Content){
  return `Kind: ${c.kind==="work"?"book":"story"}\nCurrent title: ${c.title}\nGenre: ${c.genre}\nAudience: ${c.audience}\nLanguage: ${c.language}\nTradition: ${c.tradition||"not specified"}\nExisting summary: ${c.existingSummary||"none"}\n\nText excerpt:\n"""\n${c.excerpt}\n"""`;
}

const TITLE_SYSTEM=`You are the titling editor for "Sacred Stories", a respectful audio library of scripture, mythology, folklore, ghost stories and children's tales from many religions.
Rules:
- Titles are evocative, specific to the content, 2-7 words, and easy to say aloud. No clickbait, no emojis, no quotation marks.
- Write titles in the same language as the text excerpt.
- If the work is a well-known scripture or classic (e.g. Genesis, Dhammapada, Bhagavad Gita, Alice in Wonderland), keep its canonical name as the first suggestion and offer subtitled variants after it.
- Children's titles are warm and inviting; ghost-story titles are atmospheric, never gory.
- Never mock or sensationalise any faith.
Also write a 1-2 sentence listener-facing summary (no spoilers of the ending).`;

export async function suggestTitles(prisma:PrismaClient,kind:CatalogKind,id:string){
  const c=await loadContent(prisma,kind,id);
  return chatJson<{titles:string[];summary:string}>(TITLE_SYSTEM,
    `Suggest 5 titles for this ${kind==="work"?"book":"story"}.\n\n${describe(c)}`,
    {type:Type.OBJECT,properties:{titles:{type:Type.ARRAY,items:{type:Type.STRING},minItems:3,maxItems:5},summary:{type:Type.STRING}},required:["titles","summary"]}
  );
}

const ART_SYSTEM=`You are the art director for "Sacred Stories", a premium audiobook app. Write one image-generation prompt for a book-cover illustration based on the content given.
Cover requirements:
- Portrait book-cover composition, one clear focal subject drawn from a specific moment, setting or symbol in the text, rich lighting, professional illustration quality, cohesive palette suited to the genre.
- Leave calm, uncluttered space in the top third for the title, which is added separately. ABSOLUTELY NO text, letters, words, numbers, logos, signatures or watermarks in the image.
- Genre style: children's tales: warm, friendly picture-book illustration, soft shapes, nothing frightening. Ghost stories: atmospheric, moody, mysterious, suggestive rather than explicit; no gore, blood or jump-scare faces. Mythology/epics: cinematic, majestic, painterly. Scripture: reverent, contemplative, symbolic (light, landscapes, sacred architecture, manuscripts, nature), never sensational. Folklore: textured, regional, storyteller warmth. Mystery/thriller: noir lighting, tension through composition.
- Cultural and religious accuracy: clothing, architecture, landscape and art style must match the story's region and era. Depict deities only with traditional, respectful iconography. Never depict the Prophet Muhammad, other prophets in Islam, or God in religions that prohibit depiction; for Islamic content use calligraphy-free geometric patterns, architecture, light and landscape instead. Never show sacred figures in disrespectful, sexualised or violent ways.
- No real or living people, no recognisable celebrities, no copyrighted characters or brand designs.`;

export async function buildCoverBrief(c:Content,direction?:string){
  return chatJson<{prompt:string;mood:string}>(ART_SYSTEM,
    `Create the cover prompt.\n${direction?`Editor's art direction (follow it unless it breaks a rule): ${direction}\n`:""}\n${describe(c)}`,
    {type:Type.OBJECT,properties:{prompt:{type:Type.STRING},mood:{type:Type.STRING}},required:["prompt","mood"]}
  );
}

/** Generates (or regenerates) cover art, stores it, and saves it on the story/book. */
export async function generateCover(prisma:PrismaClient,kind:CatalogKind,id:string,direction?:string){
  const content=await loadContent(prisma,kind,id);
  const brief=await buildCoverBrief(content,direction);
  const prompt=`${brief.prompt}\n\nPortrait book cover illustration. Leave the top third calm for a title. No text, letters or watermarks anywhere in the image.`;
  const image=await generateImage(prompt);
  const ext=image.mimeType.includes("jpeg")||image.mimeType.includes("jpg")?"jpg":image.mimeType.includes("webp")?"webp":"png";
  // A new key per generation: covers are cached forever, so regenerating must change the URL.
  const key=`covers/${kind}/${id}/${Date.now()}.${ext}`;
  await storeAudioAt(key,image.data,ext);
  const data={coverImageKey:key,coverPrompt:prompt.slice(0,4000),coverUpdatedAt:new Date()};
  if(kind==="story")await prisma.story.update({where:{id},data});
  else await prisma.work.update({where:{id},data});
  return {coverUrl:audioPublicUrl(key),prompt:brief.prompt,mood:brief.mood};
}

export function coverUrl(key?:string|null){return key?audioPublicUrl(key):null}
