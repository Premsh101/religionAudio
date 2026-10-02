import fs from "node:fs/promises";
import path from "node:path";

export type StoredAudio={storageKey:string;url:string;bytes:number};

const root=process.env.AUDIO_STORAGE_DIR||path.join(process.cwd(),".audio");
const publicBase=(process.env.AUDIO_PUBLIC_BASE_URL||"").replace(/\/$/,"");

export async function storeAudio(buffer:Buffer,extension="wav"):Promise<StoredAudio>{
 const key=`${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}.${extension}`;
 const target=path.join(root,key);
 await fs.mkdir(path.dirname(target),{recursive:true});
 await fs.writeFile(target,buffer);
 return {storageKey:key,url:publicBase?`${publicBase}/${key}`:`/api/audio/file/${encodeURIComponent(key)}`,bytes:buffer.byteLength};
}

export async function readStoredAudio(key:string){
 const safe=path.normalize(key).replace(/^([.][.][/\\])+/,"");
 if(safe!==key||safe.includes(".."))throw new Error("Invalid audio key");
 return fs.readFile(path.join(root,safe));
}
