import { NextResponse } from "next/server";
import { getPrisma } from "../../../lib/server/prisma";

export const dynamic = "force-dynamic";

export async function GET(){
  const checks:{database:"ok"|"error"}={database:"error"};
  const prisma=getPrisma();
  if(prisma){
    try{
      await prisma.$queryRaw`SELECT 1`;
      checks.database="ok";
    }catch{}
  }
  const healthy=checks.database==="ok";
  return NextResponse.json(
    {status:healthy?"ok":"degraded",checks,service:"religion-audio"},
    {status:healthy?200:503}
  );
}
