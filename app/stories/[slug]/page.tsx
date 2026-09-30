import StoryClient from "./StoryClient";
import stories from "../../../data/stories.seed.json";

type Story={title:string;slug:string;content_type:string;audience:string;age_min:number;age_max:number;tag:string;narration_profile:string;style_notes:string;status:string};

export default async function StoryPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const story=(stories as Story[]).find(item=>item.slug===slug) || (stories as Story[])[0];
  return <StoryClient story={story}/>;
}
