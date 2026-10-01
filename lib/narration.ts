export type NarrationProfile="default"|"scripture"|"mythology"|"folklore"|"ghost"|"kids"|"moral-tale";
export type NarrationPlan={profile:NarrationProfile;engine:"kokoro"|"chatterbox"|"browser";rate:number;pitch:number;pauseMs:number;emotion:string;prompt:string};
export const NARRATION_PROFILE_BY_CONTENT:Record<string,NarrationProfile>={scripture:"scripture",translation:"scripture",commentary:"scripture",mythology:"mythology",folklore:"folklore","ghost-story":"ghost","moral-tale":"moral-tale",story:"mythology",biography:"folklore"};
const PLANS:Record<NarrationProfile,NarrationPlan>={
 default:{profile:"default",engine:"kokoro",rate:1,pitch:0,pauseMs:240,emotion:"natural, warm",prompt:"Read naturally and clearly."},
 scripture:{profile:"scripture",engine:"kokoro",rate:.88,pitch:0,pauseMs:420,emotion:"reverent, calm, measured",prompt:"Read with respectful clarity. Never imitate a specific living or identifiable person. Keep pauses natural around verse boundaries."},
 mythology:{profile:"mythology",engine:"chatterbox",rate:.96,pitch:0,pauseMs:260,emotion:"warm, cinematic, expressive",prompt:"Tell this as an oral epic with wonder, varied pacing and clear character contrast without theatrical overacting."},
 folklore:{profile:"folklore",engine:"chatterbox",rate:.92,pitch:0,pauseMs:320,emotion:"intimate, conversational, suspenseful",prompt:"Sound like a skilled local storyteller sharing a tale around a gathering. Use controlled suspense and natural pauses."},
 ghost:{profile:"ghost",engine:"chatterbox",rate:.82,pitch:-1,pauseMs:520,emotion:"quiet, tense, atmospheric",prompt:"Build suspense through silence and restrained intensity. Avoid gore, screaming and caricature."},
 kids:{profile:"kids",engine:"kokoro",rate:1.02,pitch:1,pauseMs:220,emotion:"warm, playful, encouraging",prompt:"Use a friendly, clear pace for children. Make character dialogue easy to follow and avoid frightening intensity."},
 "moral-tale":{profile:"moral-tale",engine:"kokoro",rate:.98,pitch:0,pauseMs:240,emotion:"bright, warm, reflective",prompt:"Keep the story easy to follow and let the lesson emerge naturally rather than sounding preachy."}
};
export function narrationProfileFor(contentType?:string,audience?:string):NarrationProfile{if((audience||"").toLowerCase()==="kids")return "kids";return NARRATION_PROFILE_BY_CONTENT[(contentType||"").toLowerCase()]||"default"}
export function getNarrationPlan(profile:string):NarrationPlan{return PLANS[profile as NarrationProfile]||PLANS.default}
export function buildTTSRequest(text:string,profile:string,language="en"){const plan=getNarrationPlan(profile);return {text,language,profile,engine:plan.engine,rate:plan.rate,pitch:plan.pitch,pause_ms:plan.pauseMs,emotion:plan.emotion,instructions:plan.prompt};}
