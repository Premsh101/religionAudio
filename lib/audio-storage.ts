import fs from "node:fs/promises";
import path from "node:path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

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

export async function storeAudio(buffer:Buffer,extension="wav"):Promise<StoredAudio>{
 const key=keyFor(extension);
 if(provider==="r2"){
   if(!r2||!bucket)throw new Error("R2 storage is not configured.");
   await r2.send(new PutObjectCommand({Bucket:bucket,Key:key,Body:buffer,ContentType:extension==="mp3"?"audio/mpeg":"audio/wav",CacheControl:"public, max-age=31536000, immutable"}));
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

export function audioStorageProvider(){return provider}

export function audioPublicUrl(key:string){
 const base=r2PublicBase||publicBase;
 return base?base+"/"+key:key.split("/").map(encodeURIComponent).join("/") ? "/api/audio/file/"+key.split("/").map(encodeURIComponent).join("/") : "";
}
