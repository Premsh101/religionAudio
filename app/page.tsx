import HomeClient from "../components/home/HomeClient";
import { getPrisma } from "../lib/server/prisma";
import { getNewArrivals } from "../lib/server/recommendations";

export const dynamic="force-dynamic";

export default async function HomePage(){
  const prisma=getPrisma();
  const newArrivals=prisma?await getNewArrivals(prisma,5).catch(()=>[]):[];
  return <HomeClient newArrivals={newArrivals}/>;
}
