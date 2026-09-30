import { NextRequest } from "next/server";
import { formatRetrievedContext } from "../../../lib/retrieval";

export async function POST(request:NextRequest){
  const {question}=await request.json();
  if(typeof question!=="string" || !question.trim()){
    return Response.json({error:"Question is required."},{status:400});
  }

  const retrieved=formatRetrievedContext(question);
  const endpoint=process.env.AI_BASE_URL;
  const apiKey=process.env.AI_API_KEY;
  const model=process.env.AI_MODEL || "gpt-4o-mini";

  const system=[
    "You are an evidence-aware religious text research assistant.",
    "Never invent scripture, verse numbers, quotations or citations.",
    "Keep four lenses separate: TEXT (what retrieved sources say), TRADITION (named interpretations), SCHOLARSHIP (historical/textual/archaeological work), SCIENCE (empirical evidence only).",
    "Do not turn myths, folklore or supernatural traditions into scientific facts.",
    "When evidence is absent, say so.",
    "",
    "Currently retrieved TEXT context:",
    retrieved.context
  ].join("\n");

  if(!endpoint || !apiKey){
    return Response.json({
      answer:"AI gateway is not configured yet. Here is the retrieved source context so the interface can be tested safely.",
      context:retrieved.context,
      citations:retrieved.citations,
      lenses:["Text","Tradition","Scholarship","Science"]
    });
  }

  const response=await fetch(endpoint,{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Authorization":"Bearer " + apiKey
    },
    body:JSON.stringify({
      model,
      messages:[
        {role:"system",content:system},
        {role:"user",content:question}
      ],
      temperature:0.2
    }),
    cache:"no-store"
  });

  if(!response.ok){
    return Response.json({
      error:"AI provider returned " + response.status + ".",
      citations:retrieved.citations
    },{status:502});
  }

  const data=await response.json();
  return Response.json({
    answer:data.choices?.[0]?.message?.content || "No answer returned.",
    context:retrieved.context,
    citations:retrieved.citations,
    lenses:["Text","Tradition","Scholarship","Science"]
  });
}
