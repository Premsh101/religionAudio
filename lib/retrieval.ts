import dhp from "../data/library/buddhism/dhammapada/dhp1-20_translation-en-sujato.json";

type PassageFile={passages:Record<string,string>};

function tokenize(value:string){
  return value.toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(t=>t.length>2);
}

export function retrieveDhammapada(question:string,limit=6){
  const qTokens=new Set(tokenize(question));
  return Object.entries((dhp as PassageFile).passages)
    .filter(([ref,text])=>/^dhp\d+:\d+$/.test(ref)&&text.trim())
    .map(([ref,text])=>{
      const tokens=tokenize(text);
      const score=tokens.reduce((n,t)=>n+(qTokens.has(t)?1:0),0);
      return {ref,text:text.trim(),score};
    })
    .filter(row=>row.score>0)
    .sort((a,b)=>b.score-a.score)
    .slice(0,limit);
}

export function formatRetrievedContext(question:string){
  const matches=retrieveDhammapada(question);
  return {
    context:matches.length?matches.map(m=>`[${m.ref}] ${m.text}`).join("\n"):"No matching passage was found in the currently indexed Dhammapada sample.",
    citations:matches.map(m=>({lens:"TEXT",reference:m.ref,source:"SuttaCentral Bilara Data",url:"https://github.com/suttacentral/bilara-data",translator:"Bhikkhu Sujato"}))
  };
}