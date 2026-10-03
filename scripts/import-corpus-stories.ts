import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { readCorpusCollections, toStoryFields } from "../lib/corpus-import";

/**
 * Loads data/story-corpus/<collection>/stories.json into the Story table.
 * New stories arrive as REVIEW (approve them in Studio → Review & covers). Re-running is safe:
 * it refreshes the texts but never touches status, edited titles/summaries, covers or publish dates.
 */
async function main(){
  if(!process.env.DATABASE_URL)throw new Error("DATABASE_URL is required");
  const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});
  let created=0,updated=0,skipped=0;
  try{
    for(const {collection,record} of readCorpusCollections()){
      const f=toStoryFields(collection,record);
      if(!f.body){skipped++;continue}
      const shared={collection:f.collection,type:f.type as never,audience:f.audience as never,ageMin:f.ageMin,ageMax:f.ageMax,body:f.body,contentWarnings:f.contentWarnings,matureContent:f.matureContent,translations:f.translations??undefined};
      const existing=await prisma.story.findUnique({where:{corpusId:f.corpusId},select:{id:true,narrationProfile:true}});
      if(existing){
        // A story still on the generic style picks up its collection's style; a hand-picked style is kept.
        await prisma.story.update({where:{id:existing.id},data:{...shared,...(existing.narrationProfile==="DEFAULT"?{narrationProfile:f.narrationProfile as never}:{})}});
        updated++;
      }else{
        const slugTaken=await prisma.story.findUnique({where:{slug:f.corpusId},select:{id:true}});
        if(slugTaken){skipped++;console.warn("Slug already used, skipped:",f.corpusId);continue}
        await prisma.story.create({data:{...shared,corpusId:f.corpusId,slug:f.corpusId,title:f.title,language:f.language,summary:f.summary,narrationProfile:f.narrationProfile as never,status:"REVIEW"}});
        created++;
      }
    }
    console.log(`Corpus import: ${created} new (waiting for review), ${updated} refreshed, ${skipped} skipped.`);
  }finally{await prisma.$disconnect()}
}

main().catch(e=>{console.error(e instanceof Error?e.message:e);process.exitCode=1});
