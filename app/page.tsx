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
  const groups=groupByCategory(cards);
  if(!user)return <Landing picks={picks} sample={cards.slice(0,12)} counts={Object.fromEntries(groups.map(g=>[g.category,g.stories.length]))}/>;
  const top=[...cards].sort((a,b)=>b.popularity-a.popularity).slice(0,10);
  return <SignedInHome picks={picks} groups={groups} newest={cards.filter(c=>c.isNew).slice(0,12)} top={top}/>;
}
