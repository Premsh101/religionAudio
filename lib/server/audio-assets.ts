import type { PrismaClient } from "../../generated/prisma/client";
import { buildSegmentRequests } from "../audio-pipeline";
import { resolveAudioSource } from "../audio-source";
import { normalizeProfile, type VoiceGender } from "../narration";

export type AudioTarget={workId?:string;storyId?:string;contentId?:string};
export type EnsureResult={assetId:string;status:"QUEUED"|"PROCESSING"|"READY"|"FAILED";totalSegments:number;reused:boolean};

/**
 * Returns the narration for a target + language + voice, creating it (and its jobs) only if none exists yet.
 * Every listener after the first reuses the same stored audio.
 */
export async function ensureAudioAsset(prisma:PrismaClient,opts:AudioTarget&{language:string;voiceGender:VoiceGender;narrationProfile?:string;title?:string;existingOnly:true}):Promise<EnsureResult|null>;
export async function ensureAudioAsset(prisma:PrismaClient,opts:AudioTarget&{language:string;voiceGender:VoiceGender;narrationProfile?:string;title?:string;existingOnly?:false}):Promise<EnsureResult>;
export async function ensureAudioAsset(prisma:PrismaClient,opts:AudioTarget&{language:string;voiceGender:VoiceGender;narrationProfile?:string;title?:string;existingOnly?:boolean}):Promise<EnsureResult|null>;
export async function ensureAudioAsset(prisma:PrismaClient,opts:AudioTarget&{language:string;voiceGender:VoiceGender;narrationProfile?:string;title?:string;existingOnly?:boolean}):Promise<EnsureResult|null>{
  const {workId,storyId,contentId,language,voiceGender}=opts;
  const targetWhere=workId?{workId}:storyId?{storyId}:{contentId};
  const lockKey=`audio-asset:${workId||""}:${storyId||""}:${contentId||""}:${language}:${voiceGender}`;
  const activeWhere={...targetWhere,language,voiceId:voiceGender,status:{in:["QUEUED","PROCESSING","READY"] as ("QUEUED"|"PROCESSING"|"READY")[]}};
  // Fast path: almost every request after the first finds the stored narration without loading the source text.
  const known=await prisma.audioAsset.findFirst({where:activeWhere,orderBy:{createdAt:"desc"},select:{id:true,status:true,totalSegments:true}});
  if(known)return {assetId:known.id,status:known.status,totalSegments:known.totalSegments,reused:true};
  if(opts.existingOnly)return null;
  const source=await resolveAudioSource(prisma,{workId,storyId,contentId,language});
  const requested=normalizeProfile(opts.narrationProfile);
  const profile=requested!=="default"?requested:source.profile;
  const segments=buildSegmentRequests(source.text,profile,language,voiceGender);
  if(!segments.length)throw new Error("No source text available.");

  // A transaction-scoped advisory lock makes "find or create" atomic, so two simultaneous
  // first listeners cannot both queue the same narration.
  return prisma.$transaction(async tx=>{
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
    const existing=await tx.audioAsset.findFirst({where:activeWhere,orderBy:{createdAt:"desc"},select:{id:true,status:true,totalSegments:true}});
    if(existing)return {assetId:existing.id,status:existing.status,totalSegments:existing.totalSegments,reused:true};
    const asset=await tx.audioAsset.create({data:{
      title:opts.title||source.title,language,voiceId:voiceGender,narrationProfile:profile,storageKey:`pending/${Date.now()}`,
      rightsStatus:"UNKNOWN",workId:workId||undefined,storyId:storyId||undefined,contentId:contentId||undefined,
      totalSegments:segments.length,status:"QUEUED"
    }});
    await tx.audioJob.createMany({data:segments.map(segment=>({audioAssetId:asset.id,status:"QUEUED" as const,segmentSequence:segment.sequence}))});
    return {assetId:asset.id,status:"QUEUED" as const,totalSegments:segments.length,reused:false};
  });
}
