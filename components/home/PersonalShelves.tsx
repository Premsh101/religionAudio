"use client";

import { useEffect, useState } from "react";
import ItemCard from "./ItemCard";
import { Shelf } from "../StoryTile";
import { useT } from "../AppProvider";
import { getHistory } from "../../lib/client/history";
import type { FeedItem } from "../../lib/server/recommendations";

type Feed={continueItems:FeedItem[];recommended:FeedItem[];becauseYou:{seed:FeedItem;items:FeedItem[]}|null;popular:FeedItem[];newArrivals:FeedItem[]};

/** Continue listening, recommendations, "because you listened to" and popular: personalised per listener. */
export default function PersonalShelves(){
  const t=useT();
  const [feed,setFeed]=useState<Feed|null>(null);
  useEffect(()=>{
    const history=getHistory().map(({kind,id,progressPercent,completed,updatedAt,passageSequence})=>({kind,id,progressPercent,completed,updatedAt,passageSequence}));
    fetch("/api/home",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({history})})
      .then(r=>r.ok?r.json():null).then(setFeed).catch(()=>setFeed(null));
  },[]);
  if(!feed)return null;
  return <>
    {feed.continueItems.length>0&&<Shelf title={t("home.continue")} href="/history" action={t("home.history")}>{feed.continueItems.map(i=><ItemCard key={i.kind+i.id} item={i} showProgress/>)}</Shelf>}
    {feed.becauseYou&&<Shelf title={t("home.because",{title:feed.becauseYou.seed.title})}>{feed.becauseYou.items.map(i=><ItemCard key={i.kind+i.id} item={i}/>)}</Shelf>}
    {feed.recommended.length>0&&<Shelf title={t("home.recommended")}>{feed.recommended.map(i=><ItemCard key={i.kind+i.id} item={i}/>)}</Shelf>}
    {feed.popular.length>0&&<Shelf title={t("home.popular")}>{feed.popular.map(i=><ItemCard key={i.kind+i.id} item={i}/>)}</Shelf>}
  </>;
}
