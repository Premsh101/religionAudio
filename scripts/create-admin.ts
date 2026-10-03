import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { normalizeIdentifier, validateIdentifier, validatePassword } from "../lib/auth";

/**
 * Creates an admin account, or promotes an existing one and sets its password.
 *   npm run db:create-admin -- admin@example.com 'a-strong-password'
 *   npx tsx scripts/create-admin.ts --from-env      (uses ADMIN_EMAIL / ADMIN_PASSWORD; runs on every start)
 * ADMIN_PASSWORD is the source of truth: if it changes in Coolify, the next deploy updates the account to match.
 */
const fromEnv=process.argv.includes("--from-env");
const args=process.argv.slice(2).filter(a=>!a.startsWith("--"));

/** Values pasted into dashboards sometimes carry quotes or stray spaces. */
function clean(value:string|undefined){return (value||"").trim().replace(/^(["'])(.*)\1$/,"$2").trim()}

const identifier=clean(fromEnv?process.env.ADMIN_EMAIL:args[0]);
const password=fromEnv?clean(process.env.ADMIN_PASSWORD):args[1]||"";

async function main(){
  if(fromEnv&&!identifier){console.log("Admin: ADMIN_EMAIL is not set on the web service; no admin account was created.");return}
  if(fromEnv&&!password){console.log("Admin: ADMIN_PASSWORD is not set; "+identifier+" can be promoted but its password is left unchanged.")}
  if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL is required");
  if(!validateIdentifier(identifier))throw new Error(fromEnv?"Admin: ADMIN_EMAIL is not a valid email address or phone number.":"Usage: npm run db:create-admin -- email@example.com 'password'");
  if(password&&!validatePassword(password))throw new Error("Admin: the password must be 8-128 characters.");
  const normalized=normalizeIdentifier(identifier);
  const where=normalized.type==="email"?{email:normalized.value}:{phone:normalized.value};
  const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});
  try{
    const existing=await prisma.user.findUnique({where,select:{id:true,role:true,passwordHash:true}});
    if(!existing){
      if(!password)throw new Error("Admin: no account exists for "+normalized.value+"; set ADMIN_PASSWORD to create it.");
      await prisma.user.create({data:{...where,role:"ADMIN",passwordHash:await bcrypt.hash(password,12),displayName:"Admin"}});
      console.log("Admin: account created for "+normalized.value+".");
      return;
    }
    const passwordChanged=Boolean(password)&&!(await bcrypt.compare(password,existing.passwordHash));
    if(existing.role==="ADMIN"&&!passwordChanged){console.log("Admin: "+normalized.value+" is ready.");return}
    await prisma.user.update({where,data:{role:"ADMIN",...(passwordChanged?{passwordHash:await bcrypt.hash(password,12)}:{})}});
    console.log("Admin: "+normalized.value+(existing.role==="ADMIN"?"":" promoted to admin")+(passwordChanged?(existing.role==="ADMIN"?" password updated":" and password updated"):"")+".");
  }finally{await prisma.$disconnect()}
}

main().catch(error=>{console.error(error instanceof Error?error.message:error);process.exitCode=1});
