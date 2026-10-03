import Landing from "../components/home/Landing";
import SignedInHome from "../components/home/SignedInHome";
import { getLocale } from "../lib/i18n/server";
import { getPrisma } from "../lib/server/prisma";
import { getCurrentSessionUser } from "../lib/server/session";
import { categoryPicks, groupByCategory, listStoryCards } from "../lib/server/catalog";

export const dynamic="force-dynamic";

export default async function HomePage(){
  const [user,cards]=await Promise.all([getCurrentSessionUser(),listStoryCards(getPrisma(),await getLocale())]);
  const picks=categoryPicks(cards);
  if(!user)return <Landing picks={picks} sample={cards.slice(0,12)}/>;
  return <SignedInHome picks={picks} groups={groupByCategory(cards)} newest={cards.filter(c=>c.isNew).slice(0,12)}/>;
}
