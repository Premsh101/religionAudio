import { cookies } from "next/headers";
import { getPrisma } from "./prisma";
import { getCurrentSessionUser } from "./session";

export const ADULT_COOKIE="ra_adult_ok";

/** True once this visitor ticked "I am 18 or older" (cookie), or their account recorded that confirmation. */
export async function hasAdultConsent(){
  const jar=await cookies();
  if(jar.get(ADULT_COOKIE)?.value==="1")return true;
  const user=await getCurrentSessionUser();
  if(!user)return false;
  const row=await getPrisma()?.user.findUnique({where:{id:user.id},select:{adultConsentAt:true}}).catch(()=>null);
  return Boolean(row?.adultConsentAt);
}
