import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString=process.env.DATABASE_URL;
if(!connectionString) throw new Error("DATABASE_URL is required");

const adapter=new PrismaPg({connectionString});
const prisma=new PrismaClient({adapter});

type PassageFile={passages:Record<string,string>};

async function upsertSource(data:{
  externalId:string;
  name:string;
  url:string;
  license?:string;
  rightsStatus:"UNKNOWN"|"RESEARCH_ONLY"|"PERMISSION_REQUIRED"|"COMMERCIAL_CLEARED";
  commercialUse:boolean;
  attribution?:string;
  notes?:string;
}) {
  return prisma.source.upsert({
    where:{externalId:data.externalId},
    update:data,
    create:data
  });
}

async function seedDhammapada(){
  const religion=await prisma.religion.upsert({
    where:{slug:"buddhism"},
    update:{name:"Buddhism"},
    create:{name:"Buddhism",slug:"buddhism"}
  });
  const tradition=await prisma.tradition.upsert({
    where:{religionId_slug:{religionId:religion.id,slug:"theravada"}},
    update:{name:"Theravada"},
    create:{name:"Theravada",slug:"theravada",religionId:religion.id}
  });
  const source=await upsertSource({
    externalId:"suttacentral-bilara",
    name:"SuttaCentral Bilara Data",
    url:"https://github.com/suttacentral/bilara-data",
    license:"CC0",
    rightsStatus:"COMMERCIAL_CLEARED",
    commercialUse:true,
    attribution:"SuttaCentral Bilara Data; Bhikkhu Sujato",
    notes:"Re-verify current source metadata before each production redistribution."
  });
  const work=await prisma.work.upsert({
    where:{externalId:"dhp-sujato-en"},
    update:{title:"Dhammapada",language:"English",translator:"Bhikkhu Sujato",rightsStatus:"COMMERCIAL_CLEARED",religionId:religion.id,traditionId:tradition.id,sourceId:source.id},
    create:{externalId:"dhp-sujato-en",title:"Dhammapada",slug:"dhammapada-sujato-en",language:"English",translator:"Bhikkhu Sujato",rightsStatus:"COMMERCIAL_CLEARED",religionId:religion.id,traditionId:tradition.id,sourceId:source.id}
  });
  const dir=path.join(process.cwd(),"data/library/buddhism/dhammapada");
  let sequence=0;
  for(const file of fs.readdirSync(dir).filter(name=>name.endsWith(".json") && name!=="manifest.json").sort()){
    const payload=JSON.parse(fs.readFileSync(path.join(dir,file),"utf8")) as PassageFile;
    for(const [reference,text] of Object.entries(payload.passages)){
      if(!text || !/^dhp\d+:\d+$/.test(reference)) continue;
      sequence+=1;
      await prisma.passage.upsert({
        where:{workId_reference:{workId:work.id,reference}},
        update:{sequence,text,language:"English",sourceId:source.id},
        create:{reference,sequence,text,language:"English",workId:work.id,sourceId:source.id}
      });
    }
  }
  console.log("Seeded Dhammapada passages:",sequence);
}

async function seedJpsBooks(){
  const religion=await prisma.religion.upsert({
    where:{slug:"judaism"},
    update:{name:"Judaism"},
    create:{name:"Judaism",slug:"judaism"}
  });
  const tradition=await prisma.tradition.upsert({
    where:{religionId_slug:{religionId:religion.id,slug:"jewish-scriptures"}},
    update:{name:"Jewish Scriptures"},
    create:{name:"Jewish Scriptures",slug:"jewish-scriptures",religionId:religion.id}
  });
  const source=await upsertSource({
    externalId:"sefaria-jps1917",
    name:"Sefaria Export — JPS 1917",
    url:"https://github.com/Sefaria/Sefaria-Export",
    license:"Public Domain",
    rightsStatus:"COMMERCIAL_CLEARED",
    commercialUse:true,
    attribution:"JPS 1917 via Sefaria/Open Siddur Project",
    notes:"Exact edition metadata is stored with each imported work."
  });
  const dir=path.join(process.cwd(),"data/library/judaism");
  const files=fs.readdirSync(dir).filter(name=>name.endsWith(".json") && name!=="genesis-jps-1917.json");
  files.unshift("genesis-jps-1917.json");
  for(const file of files){
    const data=JSON.parse(fs.readFileSync(path.join(dir,file),"utf8"));
    const content=data.content;
    if(!content?.text || !Array.isArray(content.text)) continue;
    const title=content.title || file.replace("-jps-1917.json","");
    const externalId=file.replace(".json","");
    const slug=externalId;
    const work=await prisma.work.upsert({
      where:{externalId},
      update:{
        title,
        language:"English",
        edition:content.versionTitle || "JPS 1917",
        rightsStatus:"COMMERCIAL_CLEARED",
        religionId:religion.id,
        traditionId:tradition.id,
        sourceId:source.id
      },
      create:{
        externalId,
        title,
        slug,
        language:"English",
        edition:content.versionTitle || "JPS 1917",
        rightsStatus:"COMMERCIAL_CLEARED",
        religionId:religion.id,
        traditionId:tradition.id,
        sourceId:source.id
      }
    });
    let sequence=0;
    for(const [chapterIndex,chapter] of content.text.entries()){
      if(!Array.isArray(chapter)) continue;
      for(const [verseIndex,text] of chapter.entries()){
        if(!text) continue;
        sequence+=1;
        const reference=`${title} ${chapterIndex+1}:${verseIndex+1}`;
        await prisma.passage.upsert({
          where:{workId_reference:{workId:work.id,reference}},
          update:{sequence,text,language:"English",sourceId:source.id},
          create:{reference,sequence,text,language:"English",workId:work.id,sourceId:source.id}
        });
      }
    }
    console.log("Seeded",title,sequence,"passages");
  }
}

async function seedStoriesAndPlaces(){
  const storySeed=JSON.parse(fs.readFileSync(path.join(process.cwd(),"data/stories.seed.json"),"utf8"));
  for(const story of storySeed){
    const typeMap:any={"ghost-story":"GHOST_STORY","mythology":"MYTHOLOGY","moral-tale":"MORAL_TALE","story":"STORY"};
    const audienceMap:any={kids:"KIDS",family:"FAMILY",teens:"TEENS",adults:"ADULTS"};
    const profileMap:any={ghost:"GHOST",mythology:"MYTHOLOGY","folklore":"FOLKLORE","kids":"KIDS","scripture":"SCRIPTURE","moral-tale":"MORAL_TALE"};
    await prisma.story.upsert({
      where:{slug:story.slug},
      update:{
        title:story.title,type:typeMap[story.content_type]||"STORY",audience:audienceMap[story.audience]||"FAMILY",
        ageMin:story.age_min,ageMax:story.age_max,summary:story.style_notes,body:"Editorial draft — source and full narrative pending.",
        intensity:story.content_type==="ghost-story"?"SPOOKY":"GENTLE",
        narrationProfile:profileMap[story.narration_profile]||"DEFAULT",
        contentWarnings:story.content_type==="ghost-story"?["Supernatural folklore / scary themes"]:[],
      },
      create:{
        title:story.title,slug:story.slug,type:typeMap[story.content_type]||"STORY",audience:audienceMap[story.audience]||"FAMILY",
        ageMin:story.age_min,ageMax:story.age_max,summary:story.style_notes,body:"Editorial draft — source and full narrative pending.",
        intensity:story.content_type==="ghost-story"?"SPOOKY":"GENTLE",
        narrationProfile:profileMap[story.narration_profile]||"DEFAULT",
        contentWarnings:story.content_type==="ghost-story"?["Supernatural folklore / scary themes"]:[],
      }
    });
  }
  const placeSeed=JSON.parse(fs.readFileSync(path.join(process.cwd(),"data/places.seed.json"),"utf8"));
  for(const place of placeSeed){
    await prisma.place.upsert({
      where:{slug:place.slug},
      update:{name:place.name,country:place.country,region:place.region,placeType:place.place_type,uncertaintyNotes:place.evidence_note},
      create:{name:place.name,slug:place.slug,country:place.country,region:place.region,placeType:place.place_type,uncertaintyNotes:place.evidence_note}
    });
  }
}

async function main(){
  await seedDhammapada();
  await seedJpsBooks();
  await seedStoriesAndPlaces();
  console.log("ReligionAudio seed complete.");
}

main()
  .catch(error=>{console.error(error);process.exitCode=1})
  .finally(async()=>{await prisma.$disconnect()});
