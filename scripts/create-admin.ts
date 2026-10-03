import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { normalizeIdentifier, validateIdentifier, validatePassword } from "../lib/auth";

/**
 * Creates an admin account, or promotes an existing one.
 *   npm run db:create-admin -- admin@example.com 'a-strong-password'   (also resets that account's password)
 *   npx tsx scripts/create-admin.ts --from-env                           (uses ADMIN_EMAIL / ADMIN_PASSWORD; runs at startup)
 * With --from-env an existing account is only promoted; its password is left alone unless ADMIN_PASSWORD_RESET=true,
 * so a password changed later is not overwritten on every deploy.
 */
const fromEnv=process.argv.includes("--from-env");
const args=process.argv.slice(2).filter(a=>!a.startsWith("--"));
const identifier=fromEnv?process.env.ADMIN_EMAIL||"":args[0]||"";
const password=fromEnv?process.env.ADMIN_PASSWORD||"":args[1]||"";
const resetPassword=fromEnv?process.env.ADMIN_PASSWORD_RESET==="true":Boolean(password);

async function main(){
  if(fromEnv&&!identifier){console.log("ADMIN_EMAIL not set; skipping admin bootstrap.");return}
  if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL is required");
  if(!validateIdentifier(identifier))throw new Error("Usage: npm run db:create-admin -- email@example.com 'password'");
  const normalized=normalizeIdentifier(identifier);
  const where=normalized.type==="email"?{email:normalized.value}:{phone:normalized.value};
  const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});
  try{
    const existing=await prisma.user.findUnique({where,select:{id:true}});
    if(!existing&&!password)throw new Error("No account exists for "+normalized.value+"; a password is required to create it.");
    if(password&&!validatePassword(password))throw new Error("Password must be 8-128 characters.");
    const passwordHash=password&&(resetPassword||!existing)?await bcrypt.hash(password,12):undefined;
    const user=existing
      ? await prisma.user.update({where,data:{role:"ADMIN",...(passwordHash?{passwordHash}:{})},select:{email:true,phone:true,role:true}})
      : await prisma.user.create({data:{...where,role:"ADMIN",passwordHash:passwordHash!,displayName:"Admin"},select:{email:true,phone:true,role:true}});
    console.log(existing?"Admin role granted:":"Admin account created:",user.email||user.phone,passwordHash&&existing?"(password reset)":"");
  }finally{await prisma.$disconnect()}
}

main().catch(error=>{console.error(error instanceof Error?error.message:error);process.exitCode=1});
