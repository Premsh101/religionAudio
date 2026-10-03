import { generateJson, getVertex, textModel, vertexConfigured } from "./vertex";

/**
 * Text AI with automatic fallback: Gemini on Vertex AI first (if configured), then OpenRouter's free
 * models (if OPENROUTER_API_KEY is set). Used by Ask AI and by title / cover-brief generation.
 * Images always need Vertex (Gemini image / Imagen); OpenRouter is text only here.
 */
const OPENROUTER_URL=(process.env.OPENROUTER_BASE_URL||"https://openrouter.ai/api/v1").replace(/\/$/,"")+"/chat/completions";
// openrouter/free routes to whichever free model is available; the others are explicit free fallbacks.
const DEFAULT_FREE_MODELS="openrouter/free,google/gemma-4-31b-it:free,qwen/qwen3.8-27b:free";

export function openRouterConfigured(){return Boolean(process.env.OPENROUTER_API_KEY?.trim())}
export function textAiConfigured(){return vertexConfigured()||openRouterConfigured()}

function openRouterModels(){
  return (process.env.OPENROUTER_MODELS||DEFAULT_FREE_MODELS).split(",").map(m=>m.trim()).filter(Boolean).slice(0,3);
}

async function openRouterChat(system:string,user:string,opts:{json?:boolean;temperature?:number}){
  const models=openRouterModels();
  const res=await fetch(OPENROUTER_URL,{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Authorization":"Bearer "+process.env.OPENROUTER_API_KEY,
      // Optional attribution headers recommended by OpenRouter.
      ...(process.env.OPENROUTER_SITE_URL?{"HTTP-Referer":process.env.OPENROUTER_SITE_URL}:{}),
      "X-Title":"Sacred Stories"
    },
    body:JSON.stringify({
      model:models[0],
      models, // OpenRouter tries these in order if one is down or rate-limited
      messages:[{role:"system",content:system},{role:"user",content:user}],
      temperature:opts.temperature??0.4,
      ...(opts.json?{response_format:{type:"json_object"}}:{})
    }),
    cache:"no-store"
  });
  const data=await res.json().catch(()=>null);
  if(!res.ok)throw new Error("OpenRouter "+res.status+": "+(data?.error?.message||"request failed"));
  const text:string|undefined=data?.choices?.[0]?.message?.content;
  if(!text)throw new Error("OpenRouter returned no text.");
  return {text,model:data?.model||models[0]};
}

/** Free-form answer (Ask AI). */
export async function chatText(system:string,user:string,temperature=0.2):Promise<{text:string;provider:string}>{
  const errors:string[]=[];
  if(vertexConfigured()){
    try{
      const res=await getVertex().models.generateContent({model:textModel(),contents:user,config:{systemInstruction:system,temperature}});
      if(res.text)return {text:res.text,provider:"gemini"};
      errors.push("Gemini returned no text");
    }catch(e){errors.push("Gemini: "+(e instanceof Error?e.message:String(e)))}
  }
  if(openRouterConfigured()){
    try{const r=await openRouterChat(system,user,{temperature});return {text:r.text,provider:"openrouter:"+r.model}}
    catch(e){errors.push(e instanceof Error?e.message:String(e))}
  }
  throw new Error(errors.length?errors.join(" | "):"No AI provider is configured.");
}

/** Structured JSON (titles, cover briefs). Gemini uses a strict schema; OpenRouter uses JSON mode plus the schema in the prompt. */
export async function chatJson<T>(system:string,user:string,schema:Record<string,unknown>):Promise<T>{
  const errors:string[]=[];
  if(vertexConfigured()){
    try{return await generateJson<T>(user,schema,system)}
    catch(e){errors.push("Gemini: "+(e instanceof Error?e.message:String(e)))}
  }
  if(openRouterConfigured()){
    try{
      const r=await openRouterChat(system+"\nReply with ONLY a JSON object matching this JSON Schema, no prose: "+JSON.stringify(schema),user,{json:true,temperature:0.8});
      const match=r.text.match(/\{[\s\S]*\}/);
      return JSON.parse(match?match[0]:r.text) as T;
    }catch(e){errors.push(e instanceof Error?e.message:String(e))}
  }
  throw new Error(errors.length?errors.join(" | "):"No AI provider is configured.");
}
