import StoriesBrowser from "./StoriesBrowser";
import { getLocale } from "../../lib/i18n/server";
import { getPrisma } from "../../lib/server/prisma";
import { groupByCategory, listStoryCards } from "../../lib/server/catalog";
import { isCategoryKey } from "../../lib/categories";

export const dynamic="force-dynamic";

export default async function StoriesPage({searchParams}:{searchParams:Promise<{c?:string}>}){
  const {c}=await searchParams;
  const groups=groupByCategory(await listStoryCards(getPrisma(),await getLocale()));
  return <StoriesBrowser groups={groups} active={isCategoryKey(c)?c:null}/>;
}
