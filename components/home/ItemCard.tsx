"use client";

import Link from "next/link";
import { BookOpen, Ghost, Headphones, ScrollText, Search, Sparkles, Baby } from "lucide-react";
import type { FeedItem } from "../../lib/server/recommendations";
import { Cover } from "../StoryTile";
import { photoUrl } from "../../lib/categories";

export function iconFor(item:Pick<FeedItem,"kind"|"tag">,className="h-4 w-4"){
  if(item.kind==="work")return <ScrollText className={className}/>;
  if(item.tag==="Ghost story")return <Ghost className={className}/>;
  if(item.tag==="Mythology")return <Sparkles className={className}/>;
  if(item.tag==="Moral tale")return <Baby className={className}/>;
  if(item.tag==="Mystery")return <Search className={className}/>;
  if(item.tag==="Folklore")return <Headphones className={className}/>;
  return <BookOpen className={className}/>;
}

/** A recommended story or book in a rail, styled like the other covers. */
export default function ItemCard({item,showProgress}:{item:FeedItem;showProgress?:boolean}){
  const category=item.category||"stories";
  const coverUrl=item.coverUrl||(item.kind==="work"?photoUrl("book-open"):null);
  return <Link href={item.href} className="group block w-[46vw] max-w-[184px] shrink-0 snap-start min-[480px]:w-[184px]">
    <div className="lift-sm"><Cover title={item.title} category={category} coverUrl={coverUrl} seed={item.slug} tag={item.kind==="work"?item.tag:""} isNew={item.isNew} progress={showProgress?item.progressPercent:undefined}/></div>
    {item.reason&&<p className="mt-2.5 truncate text-xs font-semibold text-mut">{item.reason}</p>}
  </Link>;
}
