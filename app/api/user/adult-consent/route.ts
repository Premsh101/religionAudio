import { NextRequest, NextResponse } from "next/server";
import { ADULT_COOKIE } from "../../../../lib/server/adult";
import { getPrisma } from "../../../../lib/server/prisma";
import { getCurrentSessionUser } from "../../../../lib/server/session";

/** Records the visitor's "I am 18 or older" confirmation (cookie, plus the account when signed in). */
export async function POST(request:NextRequest){
  const body=await request.json().catch(()=>({}));
  if(body.confirm!==true)return NextResponse.json({error:"Please tick the box to confirm you are 18 or older."},{status:400});
  const user=await getCurrentSessionUser();
  if(user)await getPrisma()?.user.update({where:{id:user.id},data:{adultConsentAt:new Date()}}).catch(()=>null);
  const res=NextResponse.json({ok:true});
  res.cookies.set(ADULT_COOKIE,"1",{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:60*60*24*365});
  return res;
}

/** Turns the adult section off again for this browser and account. */
export async function DELETE(){
  const user=await getCurrentSessionUser();
  if(user)await getPrisma()?.user.update({where:{id:user.id},data:{adultConsentAt:null}}).catch(()=>null);
  const res=NextResponse.json({ok:true});
  res.cookies.set(ADULT_COOKIE,"",{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:0});
  return res;
}
