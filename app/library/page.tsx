import books from "../../data/catalog/books.json";
import LibraryClient, { type BookCard } from "./LibraryClient";
import { getPrisma } from "../../lib/server/prisma";
import { audioPublicUrl } from "../../lib/audio-storage";
import { getCurrentSessionUser } from "../../lib/server/session";
import { getLocale } from "../../lib/i18n/server";
import { describeHistory, loadUserHistory, type FeedItem } from "../../lib/server/recommendations";
import { categoryOf } from "../../lib/categories";
import { asTranslations, localizeStory } from "../../lib/story-i18n";

// Rendered per request so newly added or approved books appear immediately.
export const dynamic="force-dynamic";

type CatalogBook={id:string;title:string;tradition:string;collection:string;language:string;translator?:string;edition?:string;license:string;source:string;source_url:string};

function traditionOf(slug:string,title:string){
  if(slug.startsWith("dhammapada")||/dhammapada/i.test(title))return "Buddhism";
  if(slug.includes("jps")||/genesis|exodus/i.test(title))return "Judaism";
  if(/ruth|gospel|psalm/i.test(title))return "Christianity";
  return "Sacred texts";
}

export default async function LibraryPage({searchParams}:{searchParams:Promise<{tab?:string}>}){
  const {tab}=await searchParams;
  const prisma=getPrisma();
  const [user,locale]=await Promise.all([getCurrentSessionUser(),getLocale()]);
  const dbWorks=prisma?await prisma.work.findMany({
    where:{status:"PUBLISHED"},orderBy:{createdAt:"asc"},
    select:{id:true,title:true,slug:true,language:true,translator:true,edition:true,summary:true,coverImageKey:true}
  }).catch(()=>[]):[];
  // The bundled catalogue is only a fallback for an empty database, never a way around unpublishing.
  const dbHasWorks=dbWorks.length>0||(prisma?await prisma.work.count().catch(()=>0):0)>0;
  const bookCards:BookCard[]=dbHasWorks
    ?dbWorks.map(w=>({slug:w.slug,title:w.title,tradition:traditionOf(w.slug,w.title),edition:w.edition||w.translator||w.language,summary:w.summary,coverUrl:w.coverImageKey?audioPublicUrl(w.coverImageKey):null}))
    :(books as CatalogBook[]).map(b=>({slug:b.id,title:b.title,tradition:b.tradition,edition:b.edition||b.translator||b.language,summary:null,coverUrl:null}));

  let saved:FeedItem[]=[];
  let inProgress:FeedItem[]=[];
  if(user&&prisma){
    const [bookmarks,history]=await Promise.all([
      prisma.bookmark.findMany({where:{userId:user.id,OR:[{storyId:{not:null}},{workId:{not:null}}]},orderBy:{createdAt:"desc"},take:60,
        select:{id:true,createdAt:true,story:{select:{id:true,slug:true,title:true,summary:true,coverImageKey:true,collection:true,type:true,audience:true,translations:true,status:true,matureContent:true}},work:{select:{id:true,slug:true,title:true,summary:true,coverImageKey:true,status:true}}}}).catch(()=>[]),
      loadUserHistory(prisma,user.id).catch(()=>[]),
    ]);
    saved=bookmarks.flatMap((b):FeedItem[]=>{
      if(b.story&&b.story.status==="PUBLISHED"&&!b.story.matureContent){
        const s=b.story;const local=localizeStory({title:s.title,summary:s.summary||""},asTranslations(s.translations),locale);
        return [{kind:"story" as const,id:s.id,slug:s.slug,title:local.title,subtitle:local.summary,tag:"",href:"/stories/"+s.slug,createdAt:b.createdAt.toISOString(),isNew:false,coverUrl:s.coverImageKey?audioPublicUrl(s.coverImageKey):null,category:categoryOf(s)}];
      }
      if(b.work&&b.work.status==="PUBLISHED"){
        const w=b.work;
        return [{kind:"work" as const,id:w.id,slug:w.slug,title:w.title,subtitle:w.summary||"",tag:traditionOf(w.slug,w.title),href:"/read/"+w.slug,createdAt:b.createdAt.toISOString(),isNew:false,coverUrl:w.coverImageKey?audioPublicUrl(w.coverImageKey):null}];
      }
      return [];
    });
    inProgress=(await describeHistory(prisma,history,locale).catch(()=>[])).filter((i:FeedItem&{completed?:boolean})=>!i.completed);
  }
  const initialTab=tab==="progress"||tab==="books"||tab==="saved"?tab:(user?"saved":"books");
  return <LibraryClient books={bookCards} saved={saved} inProgress={inProgress} signedIn={Boolean(user)} initialTab={initialTab}/>;
}
