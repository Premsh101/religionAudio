import { cookies } from "next/headers";
import { readSessionToken } from "../../../../lib/auth";

export async function GET(){
  const cookieStore=await cookies();
  const token=cookieStore.get("religion_audio_session")?.value;
  if(!token) return Response.json({user:null});
  const user=await readSessionToken(token);
  return Response.json({user});
}
