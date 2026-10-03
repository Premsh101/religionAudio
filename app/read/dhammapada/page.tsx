import { redirect } from "next/navigation";
import DhammapadaStatic from "./DhammapadaStatic";
import { getPrisma } from "../../../lib/server/prisma";

export const dynamic="force-dynamic";

/** The full reader handles the Dhammapada once it is in the database; the bundled sample is only a fallback. */
export default async function DhammapadaPage(){
  const prisma=getPrisma();
  const work=prisma?await prisma.work.findUnique({where:{slug:"dhammapada-sujato-en"},select:{status:true}}).catch(()=>null):null;
  if(work?.status==="PUBLISHED")redirect("/read/dhammapada-sujato-en");
  return <DhammapadaStatic/>;
}
