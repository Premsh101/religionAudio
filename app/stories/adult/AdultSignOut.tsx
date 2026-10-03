"use client";

import { useRouter } from "next/navigation";

export default function AdultSignOut(){
  const router=useRouter();
  return <button onClick={async()=>{await fetch("/api/user/adult-consent",{method:"DELETE"});router.push("/stories")}} className="rounded-xl border border-line px-4 py-2 text-sm text-ink">Turn off adult content</button>;
}
