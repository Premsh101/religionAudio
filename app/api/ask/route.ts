import { NextRequest } from "next/server";

export async function POST(request:NextRequest){
  const {question}=await request.json();
  if(typeof question!=="string" || !question.trim()) return Response.json({error:"Question is required."},{status:400});

  const endpoint=process.env.AI_BASE_URL;
  const apiKey=process.env.AI_API_KEY;
  const model=process.env.AI_MODEL || "gpt-4o-mini";

  if(!endpoint || !apiKey){
    return Response.json({
      answer:"AI gateway is not configured. The UI is ready; configure AI_BASE_URL, AI_API_KEY and AI_MODEL. Production retrieval will inject source passages before the model is called.",
      lenses:["Text","Tradition","Scholarship","Science"]
    });
  }

  const system=`You are an evidence-aware religious text research assistant.
Never invent scripture, verse numbers, quotations or citations.
Keep four lenses separate: TEXT (what retrieved sources say), TRADITION (named interpretations), SCHOLARSHIP (historical/textual/archaeological work), SCIENCE (empirical evidence only).
Do not turn myths or supernatural traditions into scientific facts.
When evidence is absent, say so.
`;

  const response=await fetch(endpoint,{
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization:`Bearer ${apiKey}`},
    body:JSON.stringify({model,messages:[{role:"system",content:system},{role:"user",content:question}],temperature:0.2})
  });

  if(!response.ok) return Response.json({error:`AI provider returned ${response.status}.`},{status:502});
  const data=await response.json();
  return Response.json({answer:data.choices?.[0]?.message?.content || "No answer returned.",lenses:["Text","Tradition","Scholarship","Science"]});
}
