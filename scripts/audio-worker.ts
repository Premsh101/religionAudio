import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { buildSegmentRequests } from "../lib/audio-pipeline";
import { resolveAudioSource } from "../lib/audio-source";
import { storeAudio } from "../lib/audio-storage";

const dbUrl=process.env.DATABASE_URL;
if(!dbUrl) throw new Error("DATABASE_URL is required");
const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:dbUrl})});
const TTS=process.env.TTS_SERVICE_URL||"http://tts-service:8010";
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));

async function claimJob(){
 const jobs=await prisma.audioJob.findMany({
   where:{status:"QUEUED",nextRunAt:{lte:new Date()}},
   orderBy:{createdAt:"asc"},take:5,include:{audioAsset:true}
 });
 for(const job of jobs){
  const updated=await prisma.audioJob.updateMany({
    where:{id:job.id,status:"QUEUED"},
    data:{status:"PROCESSING",attempts:{increment:1},lockedAt:new Date()}
  });
  if(updated.count)return prisma.audioJob.findUnique({where:{id:job.id},include:{audioAsset:true}});
 }
 return null;
}

async function processJob(job:any){
 const asset=job.audioAsset;
 const source=await resolveAudioSource(prisma,asset);
 const requests=buildSegmentRequests(source.text,asset.narrationProfile||source.profile,asset.language||source.language);
 const sequence=job.segmentSequence||1;
 const segment=requests.find(s=>s.sequence===sequence);
 if(!segment)throw new Error(`Narration segment ${sequence} not found`);

 const response=await fetch(`${TTS}/synthesize`,{
   method:"POST",headers:{"content-type":"application/json"},
   body:JSON.stringify({...segment.request,text:segment.text})
 });
 if(!response.ok)throw new Error(`TTS service returned ${response.status}`);

 const result=await response.json() as {audio_url:string;engine?:string;duration_seconds?:number};
 if(!result.audio_url)throw new Error("TTS response did not include audio_url");

 const generated=await fetch(`${TTS}${result.audio_url}`);
 if(!generated.ok)throw new Error(`Unable to download generated audio: ${generated.status}`);
 const buffer=Buffer.from(await generated.arrayBuffer());
 const stored=await storeAudio(buffer,"wav");

 await prisma.audioSegment.upsert({
   where:{audioAssetId_sequence:{audioAssetId:asset.id,sequence:segment.sequence}},
   update:{startMs:segment.startMs,endMs:segment.endMs,storageKey:stored.storageKey,transcript:segment.text},
   create:{audioAssetId:asset.id,sequence:segment.sequence,startMs:segment.startMs,endMs:segment.endMs,storageKey:stored.storageKey,transcript:segment.text}
 });

 await prisma.audioAsset.update({
   where:{id:asset.id},
   data:{engine:result.engine||asset.engine||"local",durationMs:result.duration_seconds?Math.round(result.duration_seconds*1000):asset.durationMs}
 });

 const remaining=await prisma.audioJob.count({
   where:{audioAssetId:asset.id,status:{in:["QUEUED","PROCESSING","FAILED"]}}
 });
 if(remaining===0){
   await prisma.audioAsset.update({where:{id:asset.id},data:{storageKey:stored.storageKey}});
 }
 await prisma.audioJob.update({where:{id:job.id},data:{status:"COMPLETED",lockedAt:null,errorMessage:null}});
}

async function failJob(job:any,error:unknown){
 const attempts=job.attempts as number;
 const final=attempts>=job.maxAttempts;
 await prisma.audioJob.update({
   where:{id:job.id},
   data:{
     status:final?"FAILED":"QUEUED",
     lockedAt:null,
     errorMessage:String(error),
     nextRunAt:new Date(Date.now()+Math.min(3600000,Math.pow(2,attempts)*10000))
   }
 });
}

async function main(){
 console.log(`Audio worker listening on ${TTS}`);
 while(true){
  const job=await claimJob();
  if(!job){await sleep(5000);continue}
  try{await processJob(job)}catch(error){console.error("Audio job failed",job.id,error);await failJob(job,error)}
 }
}
main().catch(async e=>{console.error(e);await prisma.$disconnect();process.exit(1)});
