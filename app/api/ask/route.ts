import { NextRequest } from "next/server";
import { formatRetrievedContext } from "../../../lib/retrieval";
import { getPrisma } from "../../../lib/server/prisma";
import { chatText, textAiConfigured } from "../../../lib/server/ai/text";
import { RULES, clientIp, hit, tooManyRequests } from "../../../lib/server/rate-limit";
import { staffOnlyResponse } from "../../../lib/server/staff";

export const dynamic="force-dynamic";

function safeQuestion(value:unknown){
  return typeof value==="string" ? value.trim().slice(0,2000) : "";
}

export async function POST(request:NextRequest){
  const denied=await staffOnlyResponse();
  if(denied)return denied;
  const limit=await hit(RULES.askPerIp,clientIp(request));
  if(!limit.ok)return tooManyRequests(limit,"You've asked a lot of questions in the last hour.");
  const question=safeQuestion((await request.json().catch(()=>({}))).question);
  if(!question) return Response.json({error:"Question is required."},{status:400});

  const retrieved=await formatRetrievedContext(question);
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

  if(!textAiConfigured()){
    return Response.json({answer:"Ask AI is not configured yet. Add a free OpenRouter key (OPENROUTER_API_KEY) or the Gemini key in the server settings. The indexed source context is available for testing.",context:retrieved.context,citations:retrieved.citations,lenses:["Text","Tradition","Scholarship","Science"]});
  }

  let answer="";
  try{answer=(await chatText(system,question,0.2)).text}
  catch{return Response.json({error:"The AI service is busy or unavailable right now. Please try again in a minute.",citations:retrieved.citations},{status:502})}

  // Persist only the evidence metadata, not the user's question or generated answer.
  const prisma=getPrisma();
  if(prisma){
    try{
      await prisma.aICitation.createMany({data:retrieved.citations.map((c:any)=>({lens:"TEXT",sourceName:c.source,sourceUrl:c.url||null,quote:c.reference||null,note:c.translator?"Translator: "+c.translator:null}))});
    }catch{}
  }

  return Response.json({answer,context:retrieved.context,citations:retrieved.citations,lenses:["Text","Tradition","Scholarship","Science"]});
}
