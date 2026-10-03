import fs from "node:fs/promises";
import path from "node:path";
import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export type StoredAudio={storageKey:string;url:string;bytes:number};

/** Env values pasted from dashboards sometimes carry quotes or stray spaces. */
function env(name:string){return (process.env[name]||"").trim().replace(/^(["'])(.*)\1$/,"$2").trim()}

const bucket=env("R2_BUCKET");
const r2AccessKeyId=env("R2_ACCESS_KEY_ID");
const r2SecretAccessKey=env("R2_SECRET_ACCESS_KEY");

/**
 * R2 endpoint from R2_ACCOUNT_ID, or from R2_ENDPOINT exactly as Cloudflare shows it
 * (a trailing "/<bucket>" path is dropped, since the bucket is passed separately).
 */
function r2Endpoint(){
 const accountId=env("R2_ACCOUNT_ID");
 if(accountId)return `https://${accountId}.r2.cloudflarestorage.com`;
 const raw=env("R2_ENDPOINT");
 if(!raw)return "";
 try{return new URL(raw.includes("://")?raw:`https://${raw}`).origin}catch{return ""}
}
const endpoint=r2Endpoint();
const r2Ready=Boolean(endpoint&&bucket&&r2AccessKeyId&&r2SecretAccessKey);

/** R2 is used as soon as its four values are set; otherwise audio stays on the server's disk. */
const provider=r2Ready?"r2":"local";
const r2Partial=Boolean(endpoint||bucket||r2AccessKeyId||r2SecretAccessKey);
if(!r2Ready&&r2Partial)console.warn("R2 is partly configured, so audio is stored on the server's disk. Set R2_ACCOUNT_ID (or R2_ENDPOINT), R2_BUCKET, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.");
const root=process.env.AUDIO_STORAGE_DIR||path.join(process.cwd(),".audio");
const publicBase=env("AUDIO_PUBLIC_BASE_URL").replace(/\/$/,"");
const r2PublicBase=withScheme(env("R2_PUBLIC_BASE_URL")).replace(/\/$/,"");
function withScheme(url:string){return url&&!url.includes("://")?`https://${url}`:url}

const r2=r2Ready ? new S3Client({
 endpoint,
 region:"auto",
 credentials:{accessKeyId:r2AccessKeyId,secretAccessKey:r2SecretAccessKey}
}) : null;

function keyFor(extension:string){return `${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}.${extension}`}

export async function storeJson(value:unknown):Promise<StoredAudio>{
 return storeAudio(Buffer.from(JSON.stringify(value,null,2),"utf-8"),"json");
}

const CONTENT_TYPES:Record<string,string>={mp3:"audio/mpeg",json:"application/json",ogg:"audio/ogg",wav:"audio/wav",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",webp:"image/webp"};
export function contentTypeFor(extension:string){return CONTENT_TYPES[extension.toLowerCase()]||"application/octet-stream"}

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
