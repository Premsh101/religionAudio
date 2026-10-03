import fs from "node:fs/promises";
import path from "node:path";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export type StoredAudio={storageKey:string;url:string;bytes:number};

const provider=process.env.AUDIO_STORAGE_PROVIDER||"local";
const root=process.env.AUDIO_STORAGE_DIR||path.join(process.cwd(),".audio");
const publicBase=(process.env.AUDIO_PUBLIC_BASE_URL||"").replace(/\/$/,"");
const bucket=process.env.R2_BUCKET||"";
const r2PublicBase=(process.env.R2_PUBLIC_BASE_URL||"").replace(/\/$/,"");

const r2=provider==="r2" ? new S3Client({
 endpoint:process.env.R2_ENDPOINT,
 region:"auto",
 credentials:{accessKeyId:process.env.R2_ACCESS_KEY_ID||"",secretAccessKey:process.env.R2_SECRET_ACCESS_KEY||""}
}) : null;

function keyFor(extension:string){return `${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}.${extension}`}

export async function storeJson(value:unknown):Promise<StoredAudio>{
 return storeAudio(Buffer.from(JSON.stringify(value,null,2),"utf-8"),"json");
}

function contentTypeFor(extension:string){return extension==="mp3"?"audio/mpeg":extension==="json"?"application/json":extension==="ogg"?"audio/ogg":"audio/wav"}

export async function storeAudio(buffer:Buffer,extension="wav"):Promise<StoredAudio>{
 return storeAudioAt(keyFor(extension),buffer,extension);
}

/** Stores under a caller-chosen key, so identical narration maps to the same object and is generated only once. */
export async function storeAudioAt(key:string,buffer:Buffer,extension="mp3"):Promise<StoredAudio>{
 if(provider==="r2"){
   if(!r2||!bucket)throw new Error("R2 storage is not configured.");
   await r2.send(new PutObjectCommand({Bucket:bucket,Key:key,Body:buffer,ContentType:contentTypeFor(extension),CacheControl:"public, max-age=31536000, immutable"}));
   const base=r2PublicBase||publicBase;
   return {storageKey:key,url:base?`${base}/${key}`:`/api/audio/file/${key.split("/").map(encodeURIComponent).join("/")}`,bytes:buffer.byteLength};
 }
 const target=path.join(root,key);
 await fs.mkdir(path.dirname(target),{recursive:true});
 await fs.writeFile(target,buffer);
 return {storageKey:key,url:publicBase?`${publicBase}/${key}`:`/api/audio/file/${key.split("/").map(encodeURIComponent).join("/")}`,bytes:buffer.byteLength};
}

export async function readStoredAudio(key:string){
 const safe=path.normalize(key).replace(/^([.][.][/\\])+/, "");
 if(safe!==key||safe.includes(".."))throw new Error("Invalid audio key");
 if(provider==="r2"){
   if(!r2||!bucket)throw new Error("R2 storage is not configured.");
   const result=await r2.send(new GetObjectCommand({Bucket:bucket,Key:key}));
   if(!result.Body)throw new Error("Audio not found.");
   return Buffer.from(await result.Body.transformToByteArray());
 }
 return fs.readFile(path.join(root,safe));
}

export async function audioObjectExists(key:string){
 try{
  if(provider==="r2"){
   if(!r2||!bucket)return false;
   await r2.send(new HeadObjectCommand({Bucket:bucket,Key:key}));
   return true;
  }
  await fs.access(path.join(root,key));
  return true;
 }catch{return false}
}

export function audioStorageProvider(){return provider}

export function audioPublicUrl(key:string){
 const base=r2PublicBase||publicBase;
 return base?base+"/"+key:key.split("/").map(encodeURIComponent).join("/") ? "/api/audio/file/"+key.split("/").map(encodeURIComponent).join("/") : "";
}
