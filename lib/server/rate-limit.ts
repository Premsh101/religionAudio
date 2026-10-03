import { BlockList, isIP } from "node:net";
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

/** Cloudflare's published proxy ranges (https://www.cloudflare.com/ips/). */
const CLOUDFLARE_RANGES=[
  "173.245.48.0/20","103.21.244.0/22","103.22.200.0/22","103.31.4.0/22","141.101.64.0/18","108.162.192.0/18",
  "190.93.240.0/20","188.114.96.0/20","197.234.240.0/22","198.41.128.0/17","162.158.0.0/15","104.16.0.0/13",
  "104.24.0.0/14","172.64.0.0/13","131.0.72.0/22",
  "2400:cb00::/32","2606:4700::/32","2803:f800::/32","2405:b500::/32","2405:8100::/32","2a06:98c0::/29","2c0f:f248::/32",
];
const cloudflare=new BlockList();
for(const range of CLOUDFLARE_RANGES){
  const [network,prefix]=range.split("/");
  cloudflare.addSubnet(network,Number(prefix),network.includes(":")?"ipv6":"ipv4");
}

function cleanIp(value:string|null|undefined){
  const ip=(value||"").trim().replace(/^\[|\]$/g,"").replace(/^::ffff:(?=\d+\.)/i,"");
  return isIP(ip)?ip:"";
}

export function isCloudflareIp(ip:string){
  const clean=cleanIp(ip);
  return Boolean(clean)&&cloudflare.check(clean,isIP(clean)===6?"ipv6":"ipv4");
}

/**
 * The visitor's IP, worked out without any setting.
 * The peer is the address Coolify's proxy (Traefik) actually received the connection from: it appends it as the last
 * X-Forwarded-For entry, so a visitor cannot forge it. Only when that peer is one of Cloudflare's servers is the
 * CF-Connecting-IP header believed; anyone hitting the server directly cannot spoof their address with it.
 */
export function clientIp(request:Request){
  const h=request.headers;
  const forwarded=(h.get("x-forwarded-for")||"").split(",").map(cleanIp).filter(Boolean);
  const peer=forwarded.at(-1)||cleanIp(h.get("x-real-ip"));
  if(!peer)return "unknown";
  if(isCloudflareIp(peer))return cleanIp(h.get("cf-connecting-ip"))||peer;
  return peer;
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
