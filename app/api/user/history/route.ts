import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "../../../../lib/server/prisma";
import { getCurrentSessionUser } from "../../../../lib/server/session";
import { describeHistory, loadUserHistory } from "../../../../lib/server/recommendations";
import { parseClientHistory } from "../../../../lib/server/history-input";

export const dynamic="force-dynamic";

/** Everything listened to or read: the account's history merged with this browser's. */
export async function POST(request:NextRequest){
  const prisma=getPrisma();
  if(!prisma)return NextResponse.json({items:[],signedIn:false});
  const body=await request.json().catch(()=>({}));
  const user=await getCurrentSessionUser();
  const history=[...parseClientHistory(body.history),...(user?await loadUserHistory(prisma,user.id):[])];
  return NextResponse.json({items:await describeHistory(prisma,history),signedIn:Boolean(user)},{headers:{"cache-control":"no-store"}});
}
