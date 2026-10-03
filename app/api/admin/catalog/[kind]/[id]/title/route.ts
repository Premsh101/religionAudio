import { NextResponse } from "next/server";
import { parseKind, requireEditor } from "../../../../../../../lib/server/admin";
import { friendlyVertexError } from "../../../../../../../lib/server/ai/vertex";
import { suggestTitles } from "../../../../../../../lib/server/ai/covers";

export const dynamic="force-dynamic";

/** Gemini title suggestions (not saved until the editor picks one). */
export async function POST(_request:Request,{params}:{params:Promise<{kind:string;id:string}>}){
  const ctx=await requireEditor();
  if("error" in ctx)return ctx.error;
  const {kind:rawKind,id}=await params;
  const kind=parseKind(rawKind);
  if(!kind)return NextResponse.json({error:"Unknown item type."},{status:400});
  try{return NextResponse.json(await suggestTitles(ctx.prisma,kind,id))}
  catch(error){return NextResponse.json({error:friendlyVertexError(error)},{status:502})}
}
