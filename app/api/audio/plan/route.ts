import { NextRequest, NextResponse } from "next/server";
import { buildSegmentRequests } from "../../../../lib/audio-pipeline";

export async function POST(request:NextRequest){
 const body=await request.json();
 const text=typeof body.text==="string"?body.text.trim().slice(0,200000):"";
 const profile=typeof body.profile==="string"?body.profile:"folklore";
 const language=typeof body.language==="string"?body.language:"en";
 if(!text)return NextResponse.json({error:"Text is required."},{status:400});
 const segments=buildSegmentRequests(text,profile,language);
 return NextResponse.json({profile,language,totalSegments:segments.length,segments});
}
