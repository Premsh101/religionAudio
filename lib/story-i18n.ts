import { LOCALES, type Locale } from "./i18n/config";

/**
 * Story.translations holds the other-language texts ({hi,ar,ur}) and, from the corpus, translated titles
 * ("title_hi", ...) along with the English title they were made from ("title_src").
 */
export type StoryTranslations=Record<string,string>;

export function asTranslations(value:unknown):StoryTranslations{
  if(!value||typeof value!=="object"||Array.isArray(value))return {};
  return Object.fromEntries(Object.entries(value as Record<string,unknown>).filter(([,v])=>typeof v==="string"&&v.trim()).map(([k,v])=>[k,String(v)]));
}

/** Languages the story text is available in, besides its own. */
export function textLanguages(translations:StoryTranslations){return LOCALES.filter(l=>translations[l])}

/** First sentence(s), cut at a full stop in any of our scripts (. । ۔ ؟ ! ?). */
export function firstSentences(text:string,max=220){
  const clean=text.replace(/\s+/g," ").trim();
  const match=clean.match(new RegExp(`^.{30,${max}}?[.!?।۔؟](\\s|$)`));
  return (match?.[0]||clean.slice(0,max)).trim();
}

/**
 * Title and summary in the reader's language. A translated title is only used while the English title is still
 * the one it was translated from, so an editor's new title never shows next to a stale translation.
 */
export function localizeStory(story:{title:string;summary:string},translations:StoryTranslations,locale:Locale){
  if(locale==="en")return story;
  const titleOk=translations["title_"+locale]&&(!translations.title_src||translations.title_src===story.title);
  return {
    title:titleOk?translations["title_"+locale]:story.title,
    summary:translations[locale]?firstSentences(translations[locale]):story.summary,
  };
}
