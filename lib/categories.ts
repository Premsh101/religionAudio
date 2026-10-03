import type { MessageKey } from "./i18n/messages";

/** Listener-facing categories, in the order they appear. "adult" is never listed here: it has its own gated section. */
export const CATEGORY_KEYS=[
  "epics","mythology","children","festivals","adventure","moral-tales","parables","folklore","biographies","sacred-places",
  "ghost","historical","inspirational","war-courage","survival","friendship-family","romance","rituals","crime","thriller","stories",
] as const;
export type CategoryKey=typeof CATEGORY_KEYS[number];

/** Colours per category: a gradient for cards and an accent for chips. */
export const CATEGORY_STYLE:Record<CategoryKey,{from:string;to:string;emoji:string}>={
  epics:{from:"#f59e0b",to:"#7c2d12",emoji:"🏹"},
  mythology:{from:"#fb923c",to:"#7c2d12",emoji:"🪔"},
  children:{from:"#34d399",to:"#065f46",emoji:"🧸"},
  festivals:{from:"#f472b6",to:"#831843",emoji:"🎉"},
  adventure:{from:"#38bdf8",to:"#0c4a6e",emoji:"🧭"},
  "moral-tales":{from:"#fb7185",to:"#881337",emoji:"🌱"},
  parables:{from:"#a3e635",to:"#365314",emoji:"🕊️"},
  folklore:{from:"#2dd4bf",to:"#134e4a",emoji:"🌳"},
  biographies:{from:"#fcd34d",to:"#78350f",emoji:"✨"},
  "sacred-places":{from:"#c084fc",to:"#4c1d95",emoji:"🛕"},
  ghost:{from:"#a78bfa",to:"#1e1b4b",emoji:"🌙"},
  historical:{from:"#d6a76c",to:"#44281a",emoji:"📜"},
  inspirational:{from:"#facc15",to:"#713f12",emoji:"🌅"},
  "war-courage":{from:"#f87171",to:"#7f1d1d",emoji:"🛡️"},
  survival:{from:"#4ade80",to:"#14532d",emoji:"🏔️"},
  "friendship-family":{from:"#fdba74",to:"#7c2d12",emoji:"🤝"},
  romance:{from:"#f9a8d4",to:"#831843",emoji:"💞"},
  rituals:{from:"#e879f9",to:"#701a75",emoji:"🕯️"},
  crime:{from:"#94a3b8",to:"#1e293b",emoji:"🔍"},
  thriller:{from:"#f97316",to:"#431407",emoji:"⚡"},
  stories:{from:"#818cf8",to:"#312e81",emoji:"📖"},
};

export function isCategoryKey(value:unknown):value is CategoryKey{return typeof value==="string"&&(CATEGORY_KEYS as readonly string[]).includes(value)}

const BY_TYPE:Record<string,CategoryKey>={
  MYTHOLOGY:"mythology",FOLKLORE:"folklore",GHOST_STORY:"ghost",MORAL_TALE:"moral-tales",BIOGRAPHY:"biographies",
  FESTIVAL:"festivals",RITUAL:"rituals",HISTORICAL_ACCOUNT:"historical",SACRED_PLACE:"sacred-places",
};

/** Category of a story: its corpus collection when it has one, otherwise a best guess from its type and audience. */
export function categoryOf(story:{collection?:string|null;type?:string|null;audience?:string|null}):CategoryKey{
  if(isCategoryKey(story.collection))return story.collection;
  if(story.audience==="KIDS")return "children";
  return BY_TYPE[story.type||""]||"stories";
}

export function categoryLabelKey(key:CategoryKey){return ("cat."+key) as MessageKey}
export function categoryBlurbKey(key:CategoryKey){return ("catd."+key) as MessageKey}
export function categoryGradient(key:CategoryKey){const s=CATEGORY_STYLE[key];return `linear-gradient(150deg, ${s.from} 0%, ${s.to} 100%)`}
