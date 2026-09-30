import { SignJWT, jwtVerify } from "jose";

function getAuthKey(){
  const secret=process.env.AUTH_SECRET;
  if(!secret && process.env.NODE_ENV==="production"){
    throw new Error("AUTH_SECRET must be configured in production.");
  }
  return new TextEncoder().encode(secret||"development-only-change-this-secret");
}

export type SessionUser={
  id:string;
  displayName:string|null;
  email:string|null;
  phone:string|null;
  role:"USER"|"EDITOR"|"ADMIN";
};

export async function createSessionToken(user:SessionUser){
  return new SignJWT({user})
    .setProtectedHeader({alg:"HS256"})
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getAuthKey());
}

export async function readSessionToken(token:string){
  try{
    const {payload}=await jwtVerify(token,getAuthKey());
    return (payload.user || null) as SessionUser|null;
  }catch{
    return null;
  }
}

export function normalizeIdentifier(identifier:string){
  const value=identifier.trim();
  if(value.includes("@")) return {type:"email" as const,value:value.toLowerCase()};
  const phone=value.replace(/[s().-]/g,"");
  if(/^d{10}$/.test(phone)) return {type:"phone" as const,value:phone};
  return {type:"phone" as const,value};
}

export function validateIdentifier(identifier:string){
  const normalized=normalizeIdentifier(identifier);
  if(normalized.type==="email"){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.value);
  }
  return /^\+?[1-9]\d{7,14}$/.test(normalized.value);
}

export function validatePassword(password:string){
  return password.length>=8 && password.length<=128;
}
