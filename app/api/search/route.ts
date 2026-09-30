import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "../../../lib/server/prisma";

export const dynamic="force-dynamic";

function cleanQuery(value:string){
  return value.trim().slice(0,120);
}

export async function GET(request:NextRequest){
  const q=cleanQuery(request.nextUrl.searchParams.get("q")||"");
  if(q.length<2) return NextResponse.json({query:q,works:[],passages:[],stories:[]});

  const prisma=getPrisma();
  if(!prisma) return NextResponse.json({query:q,works:[],passages:[],stories:[]});

  const terms=[...new Set(q.toLowerCase().replace(/[^a-z0-9\s:-]/g," ").split(/\s+/).filter(v=>v.length>1))].slice(0,6);
  const contains=terms.length?terms: [q];

  const [works,passages,stories]=await Promise.all([
    prisma.work.findMany({
      where:{OR:contains.map(term=>({title:{contains:term,mode:"insensitive"}}))},
      take:12,
      select:{id:true,title:true,slug:true,language:true,translator:true,edition:true,rightsStatus:true,source:{select:{name:true,license:true}}}
    }),
    prisma.passage.findMany({
      where:{OR:contains.map(term=>({text:{contains:term,mode:"insensitive"}}))},
      take:30,
      orderBy:{sequence:"asc"},
      select:{id:true,reference:true,text:true,sequence:true,work:{select:{title:true,slug:true,source:{select:{name:true}}}}}
    }),
    prisma.story.findMany({
      where:{
        status:"PUBLISHED",
        OR:contains.map(term=>({OR:[
          {title:{contains:term,mode:"insensitive"}},
          {summary:{contains:term,mode:"insensitive"}},
          {body:{contains:term,mode:"insensitive"}}
        ]}))
      },
      take:12,
      orderBy:{publishedAt:"desc"},
      select:{title:true,slug:true,type:true,audience:true,summary:true,source:{select:{name:true}}}
    })
  ]);

  return NextResponse.json({query:q,works,passages,stories});
}
