import type { HistoryEntry } from "./recommendations";

/** Validates history sent from a guest's browser. */
export function parseClientHistory(value:unknown):HistoryEntry[]{
  if(!Array.isArray(value))return [];
  return value.slice(0,60).flatMap(raw=>{
    const e=raw as Record<string,unknown>;
    if((e?.kind!=="story"&&e?.kind!=="work")||typeof e.id!=="string"||e.id.length>64)return [];
    const updated=typeof e.updatedAt==="string"&&!Number.isNaN(Date.parse(e.updatedAt))?new Date(e.updatedAt):new Date();
    if(updated.getTime()>Date.now()+60000)return [];
    const passageSequence=Number(e.passageSequence);
    return [{kind:e.kind,id:e.id,progressPercent:Math.max(0,Math.min(100,Number(e.progressPercent)||0)),completed:Boolean(e.completed),updatedAt:updated.toISOString(),passageSequence:Number.isInteger(passageSequence)&&passageSequence>0?passageSequence:undefined}];
  });
}
