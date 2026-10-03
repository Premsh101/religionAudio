import { NextResponse } from "next/server";
import { getPrisma } from "./prisma";
import { getCurrentSessionUser } from "./session";

/** Editors and admins only. Returns either the context or a ready error response. */
export async function requireEditor(){
  const user=await getCurrentSessionUser();
  if(!user||(user.role!=="ADMIN"&&user.role!=="EDITOR"))return {error:NextResponse.json({error:"Editor access required."},{status:403})};
  const prisma=getPrisma();
  if(!prisma)return {error:NextResponse.json({error:"Database is not configured."},{status:503})};
  return {user,prisma};
}

export function parseKind(value:string){return value==="story"||value==="work"?value:null}
