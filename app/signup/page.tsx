"use client";

import { useState } from "react";
import Link from "next/link";
import AuthShell, { Field, FormError, PasswordInput, inputClass, primaryButton } from "../../components/AuthShell";
import { useT } from "../../components/AppProvider";
import { apiError } from "../../lib/i18n/messages";

export default function SignupPage(){
  const t=useT();
  const [displayName,setDisplayName]=useState("");
  const [identifier,setIdentifier]=useState("");
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);

  async function submit(e:React.FormEvent){
    e.preventDefault();setError("");
    if(password!==confirm){setError(t("auth.mismatch"));return}
    setBusy(true);
    try{
      const response=await fetch("/api/auth/signup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({displayName,identifier,password})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok){setError(apiError(t,response.status,data));setBusy(false);return}
      window.location.href="/";
    }catch{setError(t("auth.failed"));setBusy(false)}
  }

  return <AuthShell title={t("auth.signupTitle")} subtitle={t("auth.signupSub")}>
    <form onSubmit={submit} className="space-y-5">
      <Field label={t("auth.name")} hint={t("auth.optional")}><input value={displayName} maxLength={80} onChange={e=>setDisplayName(e.target.value)} placeholder={t("auth.namePh")} autoComplete="name" className={inputClass}/></Field>
      <Field label={t("auth.identifier")}><input required value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder={t("auth.identifierPh")} autoComplete="username" className={inputClass} dir="ltr"/></Field>
      <Field label={t("auth.password")} hint={t("auth.pwHint")}><PasswordInput value={password} onChange={setPassword} autoComplete="new-password" minLength={8}/></Field>
      <Field label={t("auth.confirm")}><PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" minLength={8}/></Field>
      <FormError message={error}/>
      <button disabled={busy} className={primaryButton}>{busy?t("auth.creating"):t("auth.signupBtn")}</button>
    </form>
    <p className="mt-8 text-center text-sm text-zinc-400">{t("auth.haveAccount")} <Link href="/login" className="font-semibold text-amber-300 hover:text-amber-200">{t("nav.login")}</Link></p>
  </AuthShell>;
}
