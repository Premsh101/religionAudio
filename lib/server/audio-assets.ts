import type { PrismaClient } from "../../generated/prisma/client";
import { buildSegmentRequests } from "../audio-pipeline";
import { resolveAudioSource } from "../audio-source";
import { normalizeProfile, type VoiceGender } from "../narration";

export type AudioTarget={workId?:string;storyId?:string;contentId?:string};

/**
 * Returns the narration for a target + language + voice, creating it (and its jobs) only if none exists yet.
 * Every listener after the first reuses the same stored audio.
 */
export async function ensureAudioAsset(prisma:PrismaClient,opts:AudioTarget&{language:string;voiceGender:VoiceGender;narrationProfile?:string;title?:string}){
  const {workId,storyId,contentId,language,voiceGender}=opts;
  const targetWhere=workId?{workId}:storyId?{storyId}:{contentId};
  const existing=await prisma.audioAsset.findFirst({
    where:{...targetWhere,language,voiceId:voiceGender,status:{in:["QUEUED","PROCESSING","READY"]}},
    orderBy:{createdAt:"desc"},
    select:{id:true,status:true,totalSegments:true}
  });
  if(existing)return {assetId:existing.id,status:existing.status,totalSegments:existing.totalSegments,reused:true};

  const source=await resolveAudioSource(prisma,{workId,storyId,contentId,language});
  const requested=normalizeProfile(opts.narrationProfile);
  const profile=requested!=="default"?requested:source.profile;
  const segments=buildSegmentRequests(source.text,profile,language,voiceGender);
  if(!segments.length)throw new Error("No source text available.");
  const asset=await prisma.audioAsset.create({data:{
    title:opts.title||source.title,language,voiceId:voiceGender,narrationProfile:profile,storageKey:`pending/${Date.now()}`,
    rightsStatus:"UNKNOWN",workId:workId||undefined,storyId:storyId||undefined,contentId:contentId||undefined,
    totalSegments:segments.length,status:"QUEUED"
  }});
  await prisma.audioJob.createMany({data:segments.map(segment=>({audioAssetId:asset.id,status:"QUEUED" as const,segmentSequence:segment.sequence}))});
  return {assetId:asset.id,status:"QUEUED" as const,totalSegments:segments.length,reused:false};
}
