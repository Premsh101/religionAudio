import type { PrismaClient } from "../../../generated/prisma/client";
import { audioPublicUrl, storeAudioAt } from "../../audio-storage";
import { generateImage, getVertex, textModel, Type } from "./vertex";
import { chatJson } from "./text";
import { categoryOf } from "../../categories";
import { findCorpusRecord } from "../../corpus-import";
import { firstSentences } from "../../story-i18n";
import { ANICONIC_RULE, COVER_STYLES, HOUSE_STYLE, needsAniconicArt, type CoverStyleKey } from "./cover-styles";

export type CatalogKind="story"|"work";

type Content={kind:CatalogKind;id:string;title:string;genre:string;audience:string;language:string;tradition:string;origin:string;tags:string[];style:CoverStyleKey;excerpt:string;existingSummary:string};

const EXCERPT_CHARS=6000;

export async function loadContent(prisma:PrismaClient,kind:CatalogKind,id:string):Promise<Content>{
  if(kind==="story"){
    const s=await prisma.story.findUnique({where:{id},select:{id:true,title:true,type:true,audience:true,language:true,summary:true,body:true,collection:true,corpusId:true,matureContent:true,religion:{select:{name:true}},tradition:{select:{name:true}},scenes:{orderBy:{sequence:"asc"},select:{text:true},take:40}}});
    if(!s)throw new Error("Story not found.");
    const text=s.scenes.map(x=>x.text).join("\n\n")||s.body;
    const corpus=s.corpusId?findCorpusRecord(s.corpusId)?.record:null;
    return {
      kind,id,title:s.title,genre:s.type.replace(/_/g," ").toLowerCase(),audience:s.audience.toLowerCase(),language:s.language,
      tradition:[s.religion?.name,s.tradition?.name,corpus?.tradition].filter(Boolean).join(" / "),
      origin:corpus?.origin||"",tags:(corpus?.tags||[]).map(String),
      style:s.matureContent?"adult":categoryOf(s),
      excerpt:text.slice(0,EXCERPT_CHARS),existingSummary:s.summary||""
    };
  }
  const w=await prisma.work.findUnique({where:{id},select:{id:true,title:true,language:true,summary:true,edition:true,religion:{select:{name:true}},tradition:{select:{name:true}},passages:{orderBy:{sequence:"asc"},select:{text:true},take:80}}});
  if(!w)throw new Error("Book not found.");
  return {kind,id,title:w.title,genre:"sacred scripture",audience:"all ages",language:w.language,tradition:[w.religion?.name,w.tradition?.name].filter(Boolean).join(" / "),origin:"",tags:[],style:"scripture",excerpt:w.passages.map(p=>p.text).join("\n").slice(0,EXCERPT_CHARS),existingSummary:w.summary||w.edition||""};
}

/** Titles that look like ids, slugs or placeholders should be replaced with a real name. */
export function needsTitle(title:string){
  const t=title.trim();
  return !t||/^untitled/i.test(t)||/[_]/.test(t)||/^[a-z0-9-]+$/.test(t)&&t.includes("-")||/^(story|book|chapter|draft)\s*\d*$/i.test(t);
}

function describe(c:Content){
  return `Kind: ${c.kind==="work"?"book":"story"}\nCurrent title: ${c.title}\nGenre: ${c.genre} (${COVER_STYLES[c.style].label})\nAudience: ${c.audience}\nLanguage: ${c.language}\nTradition: ${c.tradition||"not specified"}\nRegion / origin: ${c.origin||"not specified"}\nTags: ${c.tags.join(", ")||"none"}\nExisting summary: ${c.existingSummary||"none"}\n\nText excerpt:\n"""\n${c.excerpt}\n"""`;
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

const ART_SYSTEM=`You are the art director for "Sacred Stories", a premium audiobook app. Read the story and plan ONE front-cover illustration for it.
Think like a cover designer, not a scene illustrator:
- Choose the single most iconic, instantly recognisable image for this story: a key character at a defining (non-spoiler) moment, or a powerful symbol or setting from the text. It must be specific to THIS story, never generic.
- One focal subject that reads clearly as a small phone thumbnail. At most two characters.
- Describe what to paint concretely: who (age, build, clothing, hair), where (place, era, architecture or landscape), which objects. Make clothing, architecture, landscape and art influences accurate to the story's region and era.
- The top third of the cover must stay calm and simple (sky, mist, plain backdrop) because the title is added later as type. Never ask for any text in the image.
- Children's stories: friendly and gentle. Ghost stories: eerie but never gory. War: courage, not violence. Romance: tasteful, fully clothed.
- Religion: deities only with traditional, respectful iconography. Never depict the Prophet Muhammad, other prophets of Islam, angels, or God in traditions that forbid it; use architecture, light, landscape and objects instead. Never show sacred figures in disrespectful, sexualised or violent ways.
- No real living people, no celebrities, no copyrighted characters or brands.
Write all fields in English.`;

export type CoverBrief={moment:string;focalSubject:string;characters:string;setting:string;symbols:string;composition:string;lighting:string;palette:string;mood:string;culturalNotes:string};

const BRIEF_SCHEMA={type:Type.OBJECT,properties:{
  moment:{type:Type.STRING,description:"The specific moment or symbol from the story the cover shows (no spoilers of the ending)."},
  focalSubject:{type:Type.STRING,description:"The one main subject, described visually."},
  characters:{type:Type.STRING,description:"Up to two characters: age, appearance, era-accurate clothing, pose and expression. 'none' if the cover is a place or object."},
  setting:{type:Type.STRING,description:"Place, era, landscape or architecture behind the subject."},
  symbols:{type:Type.STRING,description:"One to three supporting motifs from the text."},
  composition:{type:Type.STRING,description:"Framing and camera angle, keeping the top third calm."},
  lighting:{type:Type.STRING},
  palette:{type:Type.STRING,description:"Three to five colours."},
  mood:{type:Type.STRING,description:"Two or three words."},
  culturalNotes:{type:Type.STRING,description:"What must be accurate or respectful for this culture or religion."},
},required:["moment","focalSubject","characters","setting","symbols","composition","lighting","palette","mood","culturalNotes"]};

/** Used when no text model is reachable: a plain brief from what we already know about the story. */
function fallbackBrief(c:Content):CoverBrief{
  const style=COVER_STYLES[c.style];
  // The title is deliberately left out: quoting it tempts image models to paint lettering.
  return {moment:firstSentences(c.existingSummary||c.excerpt,200)||"the story's defining moment",focalSubject:"the story's main character or its most powerful symbol",characters:"as described in the story",setting:c.origin||c.tradition||"the story's own setting",symbols:c.tags.slice(0,3).join(", ").toLowerCase()||"none",composition:"",lighting:style.lighting,palette:style.palette,mood:"evocative",culturalNotes:c.tradition?`Accurate to ${c.tradition}.`:"Accurate to the story's culture."};
}

export async function buildCoverBrief(c:Content,direction?:string):Promise<CoverBrief>{
  const style=COVER_STYLES[c.style];
  try{
    return await chatJson<CoverBrief>(ART_SYSTEM,
      `Plan the cover. House style for this category (${style.label}): ${style.medium} Suggested palette: ${style.palette}. Suggested lighting: ${style.lighting}.\n${direction?`Editor's art direction (follow it unless it breaks a rule): ${direction}\n`:""}\n${describe(c)}`,
      BRIEF_SCHEMA);
  }catch{return fallbackBrief(c)}
}

/** Turns the brief into the final image prompt: a cover layout every time, with the category's fixed style. */
export function coverPrompt(c:Content,brief:CoverBrief,fix?:string){
  const style=COVER_STYLES[c.style];
  const aniconic=needsAniconicArt(c.title,c.tradition,c.origin,c.tags.join(" "),c.existingSummary);
  return [
    `Front cover artwork for a premium audiobook: ${/^[aeiou]/i.test(style.label)?"an":"a"} ${style.label}${c.tradition?` from the ${c.tradition} tradition`:""}${c.origin?` (${c.origin})`:""}. It must look like a professionally published book cover, not a random scene, a photograph or a poster.`,
    `SUBJECT: ${brief.focalSubject.replace(/\.$/,"")}. MOMENT: ${brief.moment.replace(/[.\s]+$/,"")}.`,
    brief.characters&&!/^none\b/i.test(brief.characters)?`CHARACTERS: ${brief.characters}.`:"",
    `SETTING: ${brief.setting}.`,
    brief.symbols&&!/^none\b/i.test(brief.symbols)?`SUPPORTING MOTIFS: ${brief.symbols}.`:"",
    `COMPOSITION: Portrait 2:3, full-bleed artwork filling the entire frame edge to edge. One strong focal point in the lower two-thirds with a clear silhouette that reads at thumbnail size. Keep the top third calm and simple (open sky, mist, soft gradient or plain backdrop) so a title can be set over it later.${brief.composition?` ${brief.composition.replace(/\.$/,"")}.`:""} Category guidance: ${style.composition}.`,
    `STYLE: ${style.medium} ${HOUSE_STYLE}`,
    `LIGHTING: ${brief.lighting}. PALETTE: ${brief.palette}. MOOD: ${brief.mood}.`,
    `ACCURACY AND RESPECT: ${brief.culturalNotes}${aniconic?` ${ANICONIC_RULE}`:""}`,
    `DO NOT INCLUDE: any text, letters, numbers, title, captions, signatures, logos or watermarks; borders, frames, book mockups or 3D books; split panels or collages; real or living people's likenesses; ${style.avoid}.`,
    fix?`IMPORTANT, FIX FROM THE LAST ATTEMPT: ${fix}`:"",
  ].filter(Boolean).join("\n");
}

type CoverReview={hasText:boolean;looksLikeCover:boolean;showsSubject:boolean;problems:string};

/** Gemini looks at the finished image: any lettering, does it read as a cover, does it show the planned subject? */
async function reviewCover(image:{data:Buffer;mimeType:string},brief:CoverBrief):Promise<CoverReview|null>{
  try{
    const res=await getVertex().models.generateContent({
      model:textModel(),
      contents:[{role:"user",parts:[
        {inlineData:{mimeType:image.mimeType,data:image.data.toString("base64")}},
        {text:`This image should be a book-cover illustration showing: ${brief.focalSubject}; ${brief.moment}. Check it strictly.\nhasText: does it contain ANY visible letters, words, numbers, fake writing, signatures or watermarks?\nlooksLikeCover: is it a single full-bleed portrait illustration with one clear focal point and a calm top area for a title (not a collage, mockup, photo of a book or busy random scene)?\nshowsSubject: does it clearly show the intended subject?\nproblems: one short sentence on what to fix, or "none".`}
      ]}],
      config:{responseMimeType:"application/json",temperature:0,responseSchema:{type:Type.OBJECT,properties:{hasText:{type:Type.BOOLEAN},looksLikeCover:{type:Type.BOOLEAN},showsSubject:{type:Type.BOOLEAN},problems:{type:Type.STRING}},required:["hasText","looksLikeCover","showsSubject","problems"]}}
    });
    return res.text?JSON.parse(res.text) as CoverReview:null;
  }catch{return null}
}

const passes=(r:CoverReview|null)=>!r||(!r.hasText&&r.looksLikeCover&&r.showsSubject);

/**
 * Generates (or regenerates) cover art, stores it, and saves it on the story/book.
 * Each image is checked; one that has lettering, doesn't read as a cover or misses the subject is redrawn once.
 */
export async function generateCover(prisma:PrismaClient,kind:CatalogKind,id:string,direction?:string){
  const content=await loadContent(prisma,kind,id);
  const brief=await buildCoverBrief(content,direction);
  let prompt=coverPrompt(content,brief);
  let image=await generateImage(prompt);
  let review=await reviewCover(image,brief);
  if(!passes(review)){
    const fix=[review?.hasText?"the image contained lettering; remove ALL text and writing":"",review&&!review.looksLikeCover?"make it a single full-bleed cover illustration with one focal point and a calm top third":"",review&&!review.showsSubject?`clearly show ${brief.focalSubject}`:"",review?.problems&&review.problems!=="none"?review.problems:""].filter(Boolean).join("; ");
    prompt=coverPrompt(content,brief,fix);
    image=await generateImage(prompt);
    review=await reviewCover(image,brief);
  }
  const ext=image.mimeType.includes("jpeg")||image.mimeType.includes("jpg")?"jpg":image.mimeType.includes("webp")?"webp":"png";
  // A new key per generation: covers are cached forever, so regenerating must change the URL.
  const key=`covers/${kind}/${id}/${Date.now()}.${ext}`;
  await storeAudioAt(key,image.data,ext);
  const data={coverImageKey:key,coverPrompt:prompt.slice(0,4000),coverUpdatedAt:new Date()};
  if(kind==="story")await prisma.story.update({where:{id},data});
  else await prisma.work.update({where:{id},data});
  const warning=passes(review)?undefined:`Check this cover: ${[review?.hasText?"it may contain stray lettering":"",review&&!review.looksLikeCover?"it may not read well as a cover":"",review&&!review.showsSubject?"it may not show the story clearly":""].filter(Boolean).join(", ")}. Regenerate with a hint if needed.`;
  return {coverUrl:audioPublicUrl(key),prompt,moment:brief.moment,mood:brief.mood,warning};
}

export function coverUrl(key?:string|null){return key?audioPublicUrl(key):null}
