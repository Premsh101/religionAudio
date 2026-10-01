import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client/index.js";

const connectionString=process.env.DATABASE_URL;
if(!connectionString){console.error("DATABASE_URL is required");process.exit(1)}
const adapter=new PrismaPg({connectionString});
const prisma=new PrismaClient({adapter});

try{
  const [users,works,passages,stories,places,sources]=await Promise.all([
    prisma.user.count(),prisma.work.count(),prisma.passage.count(),prisma.story.count(),prisma.place.count(),prisma.source.count()
  ]);
  console.log(JSON.stringify({ok:true,counts:{users,works,passages,stories,places,sources}},null,2));
}catch(error){console.error("Database schema check failed",error);process.exitCode=1}
finally{await prisma.$disconnect()}
