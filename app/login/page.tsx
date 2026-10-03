"use client";

import { useState } from "react";
import Link from "next/link";
import AuthShell, { Field, FormError, PasswordInput, inputClass, primaryButton } from "../../components/AuthShell";
import { useT } from "../../components/AppProvider";
import { apiError } from "../../lib/i18n/messages";

export default function LoginPage(){
  const t=useT();
  const [identifier,setIdentifier]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);

  async function submit(e:React.FormEvent){
    e.preventDefault();setBusy(true);setError("");
    try{
      const response=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({identifier,password})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok){setError(apiError(t,response.status,data));setBusy(false);return}
      window.location.href="/";
    }catch{setError(t("auth.failed"));setBusy(false)}
  }

  return <AuthShell title={t("auth.loginTitle")} subtitle={t("auth.loginSub")}>
    <form onSubmit={submit} className="space-y-5">
      <Field label={t("auth.identifier")}><input required autoComplete="username" value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder={t("auth.identifierPh")} className={inputClass} dir="ltr"/></Field>
      <Field label={t("auth.password")}><PasswordInput value={password} onChange={setPassword} autoComplete="current-password"/></Field>
      <FormError message={error}/>
      <button disabled={busy} className={primaryButton}>{busy?t("auth.loggingIn"):t("auth.loginBtn")}</button>
    </form>
    <p className="mt-6 text-center text-sm text-mut">{t("auth.noAccount")} <Link href="/signup" className="font-extrabold text-acc">{t("auth.createOne")}</Link></p>
  </AuthShell>;
}
