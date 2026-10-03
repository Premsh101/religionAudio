import type { MessageKey } from "./i18n/messages";

/** Listener-facing categories, in the order they appear. "adult" is never listed here: it has its own gated section. */
export const CATEGORY_KEYS=[
  "epics","mythology","children","festivals","adventure","moral-tales","parables","folklore","biographies","sacred-places",
  "ghost","historical","inspirational","war-courage","survival","friendship-family","romance","rituals","crime","thriller","stories",
] as const;
export type CategoryKey=typeof CATEGORY_KEYS[number];

/** Colour and photo per category (from the Sunave design). Photos live in /public/images/photos. */
export const CATEGORY_STYLE:Record<CategoryKey,{color:string;photo:string;emoji:string}>={
  epics:{color:"#F57C00",photo:"epics",emoji:"🏹"},
  mythology:{color:"#7B61FF",photo:"mythology",emoji:"🪔"},
  children:{color:"#0FA896",photo:"children",emoji:"🧸"},
  festivals:{color:"#E8358B",photo:"festivals",emoji:"🎉"},
  adventure:{color:"#1E88E5",photo:"adventure",emoji:"🧭"},
  "moral-tales":{color:"#D6336C",photo:"moral-tales",emoji:"🌱"},
  parables:{color:"#2F9E8F",photo:"valley",emoji:"🕊️"},
  folklore:{color:"#1E9E5A",photo:"folklore",emoji:"🌳"},
  biographies:{color:"#C77D18",photo:"dusk-hills",emoji:"✨"},
  "sacred-places":{color:"#B7791F",photo:"sacred-places",emoji:"🛕"},
  ghost:{color:"#6A4BE0",photo:"ghost",emoji:"🌙"},
  historical:{color:"#A65A2E",photo:"desert",emoji:"📜"},
  inspirational:{color:"#E8590C",photo:"inspirational",emoji:"🌅"},
  "war-courage":{color:"#C2410C",photo:"moor",emoji:"🛡️"},
  survival:{color:"#0E8A6A",photo:"mountain-lake",emoji:"🏔️"},
  "friendship-family":{color:"#E86A33",photo:"woods",emoji:"🤝"},
  romance:{color:"#E0435F",photo:"romance",emoji:"💞"},
  rituals:{color:"#B0429A",photo:"temple-town",emoji:"🕯️"},
  crime:{color:"#3F5BD8",photo:"crime",emoji:"🔍"},
  thriller:{color:"#D9480F",photo:"road",emoji:"⚡"},
  stories:{color:"#5B5BD6",photo:"lake-dawn",emoji:"📖"},
};

/** Extra photos per category, so stories without their own cover art don't all look the same. */
const EXTRA_PHOTOS:Partial<Record<CategoryKey,string[]>>={
  ghost:["forest-mist","mountain-lake"],children:["earth","woods"],epics:["dusk-hills","mountain-lake"],"moral-tales":["pine-fog","valley"],
  "sacred-places":["temple-town","lake-dawn"],crime:["moor","road"],romance:["poppies"],adventure:["sea","road","desert"],folklore:["valley","desert","woods"],
  festivals:["temple-town"],inspirational:["sea","lake-dawn"],parables:["pine-fog"],biographies:["lake-dawn"],historical:["dusk-hills"],"war-courage":["mountain-lake"],
  survival:["sea","desert"],"friendship-family":["poppies","earth"],rituals:["festivals"],thriller:["moor"],stories:["valley","sea"],mythology:["earth"],
};

export function photoUrl(name:string){return `/images/photos/${name}.jpg`}
export function categoryPhoto(key:CategoryKey){return photoUrl(CATEGORY_STYLE[key].photo)}

/** A stable stand-in cover photo for a story until it gets generated cover art. */
export function fallbackCover(key:CategoryKey,seed:string){
  const pool=[CATEGORY_STYLE[key].photo,...(EXTRA_PHOTOS[key]||[])];
  let h=0;for(let i=0;i<seed.length;i++)h=(h*31+seed.charCodeAt(i))>>>0;
  return photoUrl(pool[h%pool.length]);
}

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
export function categoryColor(key:CategoryKey){return CATEGORY_STYLE[key].color}
/** Category tint used on covers and tiles: the colour fading to transparent, at 165°. */
export function categoryTint(key:CategoryKey){return `linear-gradient(165deg, ${CATEGORY_STYLE[key].color}99, transparent 60%)`}
