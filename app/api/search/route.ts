import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "../../../lib/server/prisma";
import { categoryOf } from "../../../lib/categories";
import { audioPublicUrl } from "../../../lib/audio-storage";

export const dynamic="force-dynamic";

function cleanQuery(value:string){
  return value.trim().slice(0,120);
}

export async function GET(request:NextRequest){
  const q=cleanQuery(request.nextUrl.searchParams.get("q")||"");
  if(q.length<2) return NextResponse.json({query:q,works:[],passages:[],stories:[]});

  const prisma=getPrisma();
  if(!prisma) return NextResponse.json({query:q,works:[],passages:[],stories:[]});

  // Letters and digits in any script, so Hindi, Arabic and Urdu searches work too.
  const terms=[...new Set(q.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s:-]/gu," ").split(/\s+/).filter(v=>v.length>1))].slice(0,6);
  const contains=terms.length?terms: [q];

  const [works,passages,stories]=await Promise.all([
    prisma.work.findMany({
      where:{status:"PUBLISHED",OR:contains.map(term=>({title:{contains:term,mode:"insensitive"}}))},
      take:12,
      select:{id:true,title:true,slug:true,language:true,translator:true,edition:true,rightsStatus:true,source:{select:{name:true,license:true}}}
    }),
    prisma.passage.findMany({
      where:{work:{status:"PUBLISHED"},OR:contains.map(term=>({text:{contains:term,mode:"insensitive"}}))},
      take:30,
      orderBy:{sequence:"asc"},
      select:{id:true,reference:true,text:true,sequence:true,work:{select:{title:true,slug:true,source:{select:{name:true}}}}}
    }),
    prisma.story.findMany({
      where:{
        status:"PUBLISHED",
        matureContent:false,
        OR:contains.map(term=>({OR:[
          {title:{contains:term,mode:"insensitive"}},
          {summary:{contains:term,mode:"insensitive"}},
          {body:{contains:term,mode:"insensitive"}}
        ]}))
      },
      take:24,
      orderBy:{publishedAt:"desc"},
      select:{id:true,title:true,slug:true,type:true,audience:true,ageMin:true,summary:true,collection:true,coverImageKey:true,source:{select:{name:true}}}
    })
  ]);

  return NextResponse.json({query:q,works,passages,stories:stories.map(({coverImageKey,collection,...s})=>({...s,category:categoryOf({collection,type:s.type,audience:s.audience}),coverUrl:coverImageKey?audioPublicUrl(coverImageKey):null}))});
}
