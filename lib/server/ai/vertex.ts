import { GoogleGenAI, Type } from "@google/genai";

/**
 * Gemini on Vertex AI. Credentials come from the service-account JSON pasted into
 * GOOGLE_VERTEX_CREDENTIALS_JSON (raw JSON, or base64 of it if your host mangles multi-line values).
 */
type ServiceAccount={project_id?:string;client_email?:string;private_key?:string};

let client:GoogleGenAI|null=null;

function readCredentials():ServiceAccount|null{
  const raw=(process.env.GOOGLE_VERTEX_CREDENTIALS_JSON||"").trim();
  if(!raw)return null;
  const text=raw.startsWith("{")?raw:Buffer.from(raw,"base64").toString("utf8");
  const creds=JSON.parse(text) as ServiceAccount;
  // Env editors often turn the key's newlines into literal "\n".
  if(creds.private_key)creds.private_key=creds.private_key.replace(/\\n/g,"\n");
  return creds;
}

export function vertexConfigured(){
  try{return Boolean(readCredentials())}catch{return false}
}

export function getVertex(){
  if(client)return client;
  const credentials=readCredentials();
  if(!credentials)throw new Error("Gemini is not configured. Paste the Vertex AI service-account JSON into GOOGLE_VERTEX_CREDENTIALS_JSON.");
  const project=process.env.GOOGLE_CLOUD_PROJECT||credentials.project_id;
  if(!project)throw new Error("Set GOOGLE_CLOUD_PROJECT (the service-account JSON has no project_id).");
  client=new GoogleGenAI({
    vertexai:true,
    project,
    location:process.env.GOOGLE_CLOUD_LOCATION||"global",
    googleAuthOptions:{credentials:{client_email:credentials.client_email,private_key:credentials.private_key},scopes:["https://www.googleapis.com/auth/cloud-platform"]}
  });
  return client;
}

export const textModel=()=>process.env.GEMINI_TEXT_MODEL||"gemini-2.5-flash";
export const imageModel=()=>process.env.GEMINI_IMAGE_MODEL||"gemini-2.5-flash-image";

export async function generateJson<T>(prompt:string,schema:Record<string,unknown>,system:string):Promise<T>{
  const res=await getVertex().models.generateContent({
    model:textModel(),
    contents:prompt,
    config:{systemInstruction:system,responseMimeType:"application/json",responseSchema:schema,temperature:0.9}
  });
  const text=res.text;
  if(!text)throw new Error("Gemini returned no text.");
  return JSON.parse(text) as T;
}

/** Returns a portrait image (PNG/JPEG bytes). Supports Gemini image models and Imagen models. */
export async function generateImage(prompt:string):Promise<{data:Buffer;mimeType:string}>{
  const ai=getVertex();
  const model=imageModel();
  if(model.startsWith("imagen")){
    const res=await ai.models.generateImages({model,prompt,config:{numberOfImages:1,aspectRatio:"3:4"}});
    const img=res.generatedImages?.[0]?.image;
    if(!img?.imageBytes)throw new Error(res.generatedImages?.[0]?.raiFilteredReason||"Imagen returned no image.");
    return {data:Buffer.from(img.imageBytes,"base64"),mimeType:img.mimeType||"image/png"};
  }
  const res=await ai.models.generateContent({
    model,
    contents:prompt,
    config:{responseModalities:["IMAGE"],imageConfig:{aspectRatio:"2:3"}}
  });
  for(const part of res.candidates?.[0]?.content?.parts||[]){
    if(part.inlineData?.data)return {data:Buffer.from(part.inlineData.data,"base64"),mimeType:part.inlineData.mimeType||"image/png"};
  }
  throw new Error("Gemini returned no image"+(res.candidates?.[0]?.finishReason?` (${res.candidates[0].finishReason})`:"")+".");
}

/** Turns common Google auth/permission failures into instructions an admin can act on. */
export function friendlyVertexError(error:unknown){
  const msg=error instanceof Error?error.message:String(error);
  if(/DECODER|PEM|private key|invalid_grant|unsupported/i.test(msg))return "The Vertex AI key in GOOGLE_VERTEX_CREDENTIALS_JSON can't be read. Paste the complete service-account JSON file (or its base64) again.";
  if(/PERMISSION_DENIED|403/.test(msg))return "Google refused the request. Give the service account the \"Vertex AI User\" role and enable the Vertex AI API for the project.";
  if(/NOT_FOUND|404|not found/i.test(msg)&&/model/i.test(msg))return "That Gemini model isn't available in this project/region. Check GEMINI_TEXT_MODEL / GEMINI_IMAGE_MODEL and GOOGLE_CLOUD_LOCATION.";
  if(/RESOURCE_EXHAUSTED|429|quota/i.test(msg))return "Vertex AI quota reached. Wait a minute and try again, or raise the quota in Google Cloud.";
  if(/SAFETY|blocked|PROHIBITED/i.test(msg))return "Gemini declined this request under its safety rules. Try again with different art direction.";
  return msg;
}

export { Type };
