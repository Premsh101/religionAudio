import { NextRequest, NextResponse } from "next/server";
import { getLocale } from "../../../lib/i18n/server";
import { getPrisma } from "../../../lib/server/prisma";
import { getCurrentSessionUser } from "../../../lib/server/session";
import { getHomeFeed, loadUserHistory } from "../../../lib/server/recommendations";
import { parseClientHistory } from "../../../lib/server/history-input";

export const dynamic="force-dynamic";

/** Personal home rows: continue listening, recommendations, "because you listened to", popular, new. */
export async function POST(request:NextRequest){
  const prisma=getPrisma();
  if(!prisma)return NextResponse.json({continueItems:[],recommended:[],becauseYou:null,popular:[],newArrivals:[]});
  const body=await request.json().catch(()=>({}));
  const user=await getCurrentSessionUser();
  const history=[...parseClientHistory(body.history),...(user?await loadUserHistory(prisma,user.id):[])];
  return NextResponse.json(await getHomeFeed(prisma,history,await getLocale()),{headers:{"cache-control":"no-store"}});
}
