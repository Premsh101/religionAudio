import { NextResponse } from "next/server";
import { getPrisma } from "./prisma";

export type RateLimitRule={name:string;limit:number;windowSeconds:number};

/** Limits applied before launch. Tune here; every value is per window. */
export const RULES={
  loginPerIp:{name:"login-ip",limit:20,windowSeconds:15*60},
  loginPerAccount:{name:"login-account",limit:5,windowSeconds:15*60},
  signupPerIp:{name:"signup-ip",limit:5,windowSeconds:60*60},
  ttsGeneratePerIp:{name:"tts-ip",limit:30,windowSeconds:60*60},
  ttsGenerateGlobal:{name:"tts-global",limit:600,windowSeconds:60*60},
  narrationRequestPerIp:{name:"narration-ip",limit:10,windowSeconds:60*60},
  askPerIp:{name:"ask-ip",limit:20,windowSeconds:60*60},
} satisfies Record<string,RateLimitRule>;

/**
 * Client IP as seen by Coolify's proxy (Traefik), which replaces any client-supplied forwarding headers.
 * Set TRUST_CLOUDFLARE_IP=true only if all traffic goes through Cloudflare's proxy.
 */
export function clientIp(request:Request){
  const h=request.headers;
  if(process.env.TRUST_CLOUDFLARE_IP==="true"&&h.get("cf-connecting-ip"))return h.get("cf-connecting-ip")!.trim();
  return h.get("x-real-ip")?.trim()||h.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";
}

export type RateLimitResult={ok:boolean;remaining:number;retryAfterSeconds:number};

/**
 * Atomic fixed-window counter in PostgreSQL, so limits survive restarts and hold across containers.
 * Fails open if the database is unavailable (the protected routes need the database anyway).
 */
export async function hit(rule:RateLimitRule,subject:string,cost=1):Promise<RateLimitResult>{
  const prisma=getPrisma();
  if(!prisma)return {ok:true,remaining:rule.limit,retryAfterSeconds:0};
  const windowMs=rule.windowSeconds*1000;
  const windowStart=new Date(Math.floor(Date.now()/windowMs)*windowMs);
  const key=`${rule.name}:${subject.toLowerCase()}`.slice(0,300);
  try{
    const rows=await prisma.$queryRaw<{count:number}[]>`
      INSERT INTO "RateLimit" ("key","windowStart","count") VALUES (${key},${windowStart},${cost})
      ON CONFLICT ("key") DO UPDATE SET
        "count"=CASE WHEN "RateLimit"."windowStart"=EXCLUDED."windowStart" THEN "RateLimit"."count"+EXCLUDED."count" ELSE EXCLUDED."count" END,
        "windowStart"=EXCLUDED."windowStart"
      RETURNING "count"`;
    // Occasionally clear expired counters so the table stays small.
    if(Math.random()<0.01)void prisma.$executeRaw`DELETE FROM "RateLimit" WHERE "windowStart" < ${new Date(Date.now()-24*3600*1000)}`.catch(()=>{});
    const count=Number(rows[0]?.count??0);
    const retryAfterSeconds=Math.max(1,Math.ceil((windowStart.getTime()+windowMs-Date.now())/1000));
    return {ok:count<=rule.limit,remaining:Math.max(0,rule.limit-count),retryAfterSeconds};
  }catch{return {ok:true,remaining:rule.limit,retryAfterSeconds:0}}
}

/** Read-only check: is this subject already over the limit? (Used to block before doing expensive work.) */
export async function isLimited(rule:RateLimitRule,subject:string):Promise<RateLimitResult>{
  const prisma=getPrisma();
  if(!prisma)return {ok:true,remaining:rule.limit,retryAfterSeconds:0};
  const windowMs=rule.windowSeconds*1000;
  const windowStart=new Date(Math.floor(Date.now()/windowMs)*windowMs);
  try{
    const row=await prisma.rateLimit.findUnique({where:{key:`${rule.name}:${subject.toLowerCase()}`.slice(0,300)}});
    const count=row&&row.windowStart.getTime()===windowStart.getTime()?row.count:0;
    return {ok:count<rule.limit,remaining:Math.max(0,rule.limit-count),retryAfterSeconds:Math.max(1,Math.ceil((windowStart.getTime()+windowMs-Date.now())/1000))};
  }catch{return {ok:true,remaining:rule.limit,retryAfterSeconds:0}}
}

export async function reset(rule:RateLimitRule,subject:string){
  const prisma=getPrisma();
  await prisma?.rateLimit.deleteMany({where:{key:`${rule.name}:${subject.toLowerCase()}`.slice(0,300)}}).catch(()=>{});
}

export function tooManyRequests(result:RateLimitResult,message:string){
  const minutes=Math.ceil(result.retryAfterSeconds/60);
  return NextResponse.json({error:`${message} Please try again in ${minutes} minute${minutes===1?"":"s"}.`,retryAfterSeconds:result.retryAfterSeconds},{status:429,headers:{"Retry-After":String(result.retryAfterSeconds)}});
}
