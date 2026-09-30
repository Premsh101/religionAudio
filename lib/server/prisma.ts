import "dotenv/config";
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma=globalThis as unknown as {religionAudioPrisma?:PrismaClient};

export function getPrisma(){
  if(!process.env.DATABASE_URL) return null;
  if(!globalForPrisma.religionAudioPrisma){
    const adapter=new PrismaPg({connectionString:process.env.DATABASE_URL});
    globalForPrisma.religionAudioPrisma=new PrismaClient({adapter});
  }
  return globalForPrisma.religionAudioPrisma;
}
