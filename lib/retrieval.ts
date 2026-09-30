import dhp from "../data/library/buddhism/dhammapada/dhp1-20_translation-en-sujato.json";
import { getPrisma } from "./server/prisma";

type PassageFile={passages:Record<string,string>};

function tokenize(value:string){
  return value.toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(t=>t.length>2);
}

function staticRetrieve(question:string,limit=6){
  const qTokens=new Set(tokenize(question));
  return Object.entries((dhp as PassageFile).passages)
    .filter(([ref,text])=>/^dhp\d+:\d+$/.test(ref)&&text.trim())
    .map(([ref,text])=>({
      ref,
      text:text.trim(),
      score:tokenize(text).reduce((n,t)=>n+(qTokens.has(t)?1:0),0)
    }))
    .filter(row=>row.score>0)
    .sort((a,b)=>b.score-a.score)
    .slice(0,limit)
    .map(row=>({
      reference:row.ref,
      text:row.text,
      source:"SuttaCentral Bilara Data",
      sourceUrl:"https://github.com/suttacentral/bilara-data",
      translator:"Bhikkhu Sujato"
    }));
}

export async function retrievePassages(question:string,limit=8){
  const prisma=getPrisma();
  if(prisma){
    try{
      const terms=tokenize(question).slice(0,8);
      if(terms.length){
        const passages=await prisma.passage.findMany({
          where:{OR:terms.map(term=>({text:{contains:term,mode:"insensitive"}}))},
          include:{work:{include:{source:true}}},
          orderBy:{sequence:"asc"},
          take:limit
        });
        if(passages.length){
          return passages.map(p=>({
            reference:p.reference,
            text:p.text,
            source:p.work.source?.name || "ReligionAudio corpus",
            sourceUrl:p.work.source?.url || undefined,
            translator:p.work.translator || undefined
          }));
        }
      }
    }catch(error){
      console.warn("Database retrieval unavailable; using static corpus fallback.",error);
    }
  }
  return staticRetrieve(question,limit);
}

export async function formatRetrievedContext(question:string){
  const matches=await retrievePassages(question);
  return {
    context:matches.length
      ? matches.map(m=>`[${m.reference}] ${m.text}`).join("\n")
      : "No matching passage was found in the currently indexed corpus.",
    citations:matches.map(m=>({
      lens:"TEXT",
      reference:m.reference,
      source:m.source,
      url:m.sourceUrl,
      translator:m.translator
    }))
  };
}
