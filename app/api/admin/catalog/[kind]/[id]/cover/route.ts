import { NextRequest, NextResponse } from "next/server";
import { parseKind, requireEditor } from "../../../../../../../lib/server/admin";
import { friendlyVertexError } from "../../../../../../../lib/server/ai/vertex";
import { generateCover } from "../../../../../../../lib/server/ai/covers";

export const dynamic="force-dynamic";
export const maxDuration=120;

/** Generate or regenerate the cover; optional art direction from the editor. */
export async function POST(request:NextRequest,{params}:{params:Promise<{kind:string;id:string}>}){
  const ctx=await requireEditor();
  if("error" in ctx)return ctx.error;
  const {kind:rawKind,id}=await params;
  const kind=parseKind(rawKind);
  if(!kind)return NextResponse.json({error:"Unknown item type."},{status:400});
  const body=await request.json().catch(()=>({}));
  const direction=typeof body.direction==="string"?body.direction.trim().slice(0,500):undefined;
  try{return NextResponse.json(await generateCover(ctx.prisma,kind,id,direction||undefined))}
  catch(error){return NextResponse.json({error:friendlyVertexError(error)},{status:502})}
}
