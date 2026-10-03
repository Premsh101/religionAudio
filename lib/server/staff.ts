import { redirect } from "next/navigation";
import { getCurrentSessionUser } from "./session";

/** Admins and editors: the people building content in the back office. */
export function isStaff(user:{role?:string}|null|undefined){return user?.role==="ADMIN"||user?.role==="EDITOR"}

/** Features still being built (Ask AI, Places, Narration lab) are hidden from listeners until they're ready. */
export async function requireStaffPage(){
  const user=await getCurrentSessionUser();
  if(!isStaff(user))redirect("/");
  return user!;
}

export async function staffOnlyResponse(){
  const user=await getCurrentSessionUser();
  return isStaff(user)?null:Response.json({error:"Not found."},{status:404});
}
