import type { Config } from "tailwindcss";

/** Colours come from CSS variables (see globals.css) so one class works in both light and dark themes. */
const v=(name:string)=>`var(--${name})`;
const config:Config={
  content:["./app/**/*.{js,ts,jsx,tsx,mdx}","./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme:{extend:{
    fontFamily:{
      display:["var(--font-serif)","Georgia","serif"],
      sans:["var(--font-sans)","var(--font-deva)","system-ui","sans-serif"],
    },
    colors:{
      bg:v("bg"),bg2:v("bg2"),card:v("card"),card2:v("card2"),line:v("line"),line2:v("line2"),
      ink:v("ink"),mut:v("mut"),mut2:v("mut2"),chip:v("chip"),acc:v("acc"),hl:v("hl"),nav:v("nav"),
      sun:"#FFB020",orange:"#FF7A3D",coral:"#FF5A5F",violet:"#7B61FF",purple:"#B061FF",pink:"#FF4FA3",teal:"#14C8B0",sky:"#3BA8FF",
    },
    boxShadow:{card:v("shadow"),glow:"0 18px 36px -16px rgba(255,90,95,.8)"},
    maxWidth:{site:"1320px"},
  }},
  plugins:[]
};
export default config;
