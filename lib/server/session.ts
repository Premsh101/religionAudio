import { cookies } from "next/headers";
import { readSessionToken, type SessionUser } from "../auth";

export async function getCurrentSessionUser(): Promise<SessionUser|null>{
  const cookieStore=await cookies();
  const token=cookieStore.get("religion_audio_session")?.value;
  if(!token) return null;
  return readSessionToken(token);
}
