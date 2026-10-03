import { useId } from "react";

/** Sunave mark ("sunrise": sound bars in a rising sun) with the optional wordmark. */
export default function SunaveLogo({size=34,wordmark=true,className=""}:{size?:number;wordmark?:boolean;className?:string}){
  const id=useId().replace(/:/g,"");
  return <span className={"inline-flex items-center leading-none "+className} style={{gap:Math.round(size*0.28)}}>
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden className="block shrink-0">
      <defs><linearGradient id={"sv"+id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFC23D"/><stop offset=".55" stopColor="#FF7A3D"/><stop offset="1" stopColor="#FF4D6D"/></linearGradient></defs>
      <circle cx="24" cy="24" r="22" fill={`url(#sv${id})`}/>
      <rect x="10.2" y="20" width="3.6" height="8" rx="1.8" fill="#fff"/>
      <rect x="16.2" y="15" width="3.6" height="18" rx="1.8" fill="#fff"/>
      <rect x="22.2" y="10.5" width="3.6" height="27" rx="1.8" fill="#fff"/>
      <rect x="28.2" y="15" width="3.6" height="18" rx="1.8" fill="#fff"/>
      <rect x="34.2" y="20" width="3.6" height="8" rx="1.8" fill="#fff"/>
    </svg>
    {wordmark&&<span className="font-sans font-extrabold text-ink" style={{fontSize:Math.round(size*0.72),letterSpacing:"-.035em"}}>sunave</span>}
  </span>;
}
