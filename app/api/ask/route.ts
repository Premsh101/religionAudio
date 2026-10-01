import { NextRequest } from "next/server";
import { formatRetrievedContext } from "../../../lib/retrieval";
import { getPrisma } from "../../../lib/server/prisma";

export const dynamic="force-dynamic";

function safeQuestion(value:unknown){
  return typeof value==="string" ? value.trim().slice(0,2000) : "";
}

export async function POST(request:NextRequest){
  const question=safeQuestion((await request.json()).question);
  if(!question) return Response.json({error:"Question is required."},{status:400});

  const retrieved=await formatRetrievedContext(question);
  const endpoint=process.env.AI_BASE_URL;
  const apiKey=process.env.AI_API_KEY;
  const model=process.env.AI_MODEL || "gpt-4o-mini";
  const system=[
    "You are an evidence-aware religious text research assistant.",
    "Never invent scripture, verse numbers, quotations, historical claims or citations.",
    "Keep four lenses separate: TEXT (what retrieved primary/secondary sources say), TRADITION (named religious interpretations), SCHOLARSHIP (historical, textual and archaeological research), SCIENCE (empirical evidence and scientific consensus only).",
    "Do not present supernatural claims, miracles, myths or folklore as scientific facts.",
    "If a question asks for a scientific explanation, explain the relevant mechanism and clearly distinguish it from the religious account.",
    "If evidence is uncertain or absent, say so rather than filling the gap.",
    "Use concise headings when useful: Text, Tradition, Scholarship, Science.",
    "Retrieved TEXT context:\n"+retrieved.context
  ].join("\n");

  if(!endpoint || !apiKey){
    return Response.json({answer:"AI gateway is not configured yet. The indexed source context is available for testing.",context:retrieved.context,citations:retrieved.citations,lenses:["Text","Tradition","Scholarship","Science"]});
  }

  const response=await fetch(endpoint,{
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":"Bearer "+apiKey},
    body:JSON.stringify({model,messages:[{role:"system",content:system},{role:"user",content:question}],temperature:0.2}),
    cache:"no-store"
  });

  if(!response.ok) return Response.json({error:"AI provider returned "+response.status+".",citations:retrieved.citations},{status:502});
  const data=await response.json();
  const answer=data.choices?.[0]?.message?.content || "No answer returned.";

  // Persist only the evidence metadata, not the user's question or generated answer.
  const prisma=getPrisma();
  if(prisma){
    try{
      await prisma.aICitation.createMany({data:retrieved.citations.map((c:any)=>({lens:"TEXT",sourceName:c.source,sourceUrl:c.url||null,quote:c.reference||null,note:c.translator?"Translator: "+c.translator:null}))});
    }catch{}
  }

  return Response.json({answer,context:retrieved.context,citations:retrieved.citations,lenses:["Text","Tradition","Scholarship","Science"]});
}
