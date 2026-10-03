import { NextRequest, NextResponse } from "next/server";
import { parseKind, requireEditor } from "../../../../../../lib/server/admin";

const STATUSES=["DRAFT","REVIEW","PUBLISHED","ARCHIVED"] as const;
type Status=typeof STATUSES[number];

/** Approve / unpublish, or apply a title and summary. */
export async function PATCH(request:NextRequest,{params}:{params:Promise<{kind:string;id:string}>}){
  const ctx=await requireEditor();
  if("error" in ctx)return ctx.error;
  const {kind:rawKind,id}=await params;
  const kind=parseKind(rawKind);
  if(!kind)return NextResponse.json({error:"Unknown item type."},{status:400});
  const body=await request.json().catch(()=>({}));
  const data:{status?:Status;publishedAt?:Date|null;title?:string;summary?:string;matureContent?:boolean}={};
  if(typeof body.status==="string"){
    if(!STATUSES.includes(body.status))return NextResponse.json({error:"Invalid status."},{status:400});
    data.status=body.status;
    data.publishedAt=body.status==="PUBLISHED"?new Date():null;
  }
  if(typeof body.title==="string"){
    const title=body.title.trim().slice(0,160);
    if(!title)return NextResponse.json({error:"Title cannot be empty."},{status:400});
    data.title=title;
  }
  if(typeof body.summary==="string")data.summary=body.summary.trim().slice(0,1000);
  if(typeof body.mature==="boolean"){
    if(kind!=="story")return NextResponse.json({error:"Only stories can be marked 18+."},{status:400});
    data.matureContent=body.mature;
  }
  if(!Object.keys(data).length)return NextResponse.json({error:"Nothing to update."},{status:400});
  try{
    const item=kind==="story"
      ? await ctx.prisma.story.update({where:{id},data,select:{id:true,title:true,status:true,summary:true}})
      : await ctx.prisma.work.update({where:{id},data,select:{id:true,title:true,status:true,summary:true}});
    return NextResponse.json({item});
  }catch{return NextResponse.json({error:"Item not found."},{status:404})}
}
