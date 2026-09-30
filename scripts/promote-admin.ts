import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { normalizeIdentifier, validateIdentifier } from "../lib/auth";

const connectionString=process.env.DATABASE_URL;
const identifier=process.argv[2];
if(!connectionString) throw new Error("DATABASE_URL is required");
if(!identifier || !validateIdentifier(identifier)) throw new Error("Usage: npm run db:make-admin -- email@example.com OR phone");

const normalized=normalizeIdentifier(identifier);
const adapter=new PrismaPg({connectionString});
const prisma=new PrismaClient({adapter});

async function main(){
  const user=await prisma.user.update({
    where:normalized.type==="email"?{email:normalized.value}:{phone:normalized.value},
    data:{role:"ADMIN"},
    select:{id:true,email:true,phone:true,displayName:true,role:true}
  });
  console.log("Admin role granted:",user);
}

main()
  .catch(error=>{console.error(error);process.exitCode=1})
  .finally(()=>prisma.$disconnect());
