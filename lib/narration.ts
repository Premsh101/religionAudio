export type NarrationProfile="default"|"scripture"|"mythology"|"folklore"|"ghost"|"kids"|"moral-tale"|"mystery"|"thriller";
export type NarrationPlan={profile:NarrationProfile;engine:"kokoro"|"chatterbox"|"browser";rate:number;pitch:number;pauseMs:number;emotion:string;prompt:string};
export const NARRATION_PROFILE_BY_CONTENT:Record<string,NarrationProfile>={scripture:"scripture",translation:"scripture",commentary:"scripture",mythology:"mythology",folklore:"folklore","ghost-story":"ghost",ghost:"ghost","moral-tale":"moral-tale",story:"mythology",biography:"folklore",crime:"mystery",mystery:"mystery",detective:"mystery",thriller:"thriller",children:"kids",kids:"kids"};
// Timing/UI hints only. Voice, speed and pauses actually used for synthesis live in services/tts/profiles.json.
const PLANS:Record<NarrationProfile,NarrationPlan>={
 default:{profile:"default",engine:"kokoro",rate:1,pitch:0,pauseMs:250,emotion:"natural, warm",prompt:"Read naturally and clearly."},
 scripture:{profile:"scripture",engine:"kokoro",rate:.88,pitch:0,pauseMs:500,emotion:"reverent, calm, measured",prompt:"Read with respectful clarity. Never imitate a specific living or identifiable person. Keep pauses natural around verse boundaries."},
 mythology:{profile:"mythology",engine:"chatterbox",rate:.96,pitch:0,pauseMs:360,emotion:"warm, cinematic, expressive",prompt:"Tell this as an oral epic with wonder, varied pacing and clear character contrast without theatrical overacting."},
 folklore:{profile:"folklore",engine:"chatterbox",rate:.92,pitch:0,pauseMs:460,emotion:"intimate, conversational, suspenseful",prompt:"Sound like a skilled local storyteller sharing a tale around a gathering. Use controlled suspense and natural pauses."},
 ghost:{profile:"ghost",engine:"chatterbox",rate:.82,pitch:-1,pauseMs:720,emotion:"quiet, tense, atmospheric",prompt:"Build suspense through silence and restrained intensity. Avoid gore, screaming and caricature."},
 kids:{profile:"kids",engine:"kokoro",rate:.95,pitch:1,pauseMs:320,emotion:"warm, playful, encouraging",prompt:"Use a friendly, clear pace for children. Make character dialogue easy to follow and avoid frightening intensity."},
 "moral-tale":{profile:"moral-tale",engine:"kokoro",rate:.98,pitch:0,pauseMs:300,emotion:"bright, warm, reflective",prompt:"Keep the story easy to follow and let the lesson emerge naturally rather than sounding preachy."},
 mystery:{profile:"mystery",engine:"kokoro",rate:.94,pitch:0,pauseMs:380,emotion:"composed, observant, curious",prompt:"Read like a calm investigator laying out clues. Give each clue and reveal a beat of space."},
 thriller:{profile:"thriller",engine:"kokoro",rate:1.02,pitch:0,pauseMs:300,emotion:"taut, urgent, controlled",prompt:"Keep momentum high with crisp phrasing; slow down only for the big turns."}
};

/** Accepts DB enum names (GHOST, MORAL_TALE), content-type slugs (ghost-story) or profile ids (ghost). */
export function normalizeProfile(profile?:string|null):NarrationProfile{
  const key=(profile||"").trim().toLowerCase().replace(/_/g,"-");
  if(key in PLANS)return key as NarrationProfile;
  return NARRATION_PROFILE_BY_CONTENT[key]||"default";
}
export function narrationProfileFor(contentType?:string,audience?:string):NarrationProfile{if((audience||"").toLowerCase()==="kids")return "kids";return normalizeProfile(contentType)}
export function getNarrationPlan(profile:string):NarrationPlan{return PLANS[normalizeProfile(profile)]}
export type VoiceGender="female"|"male";
export function normalizeVoiceGender(value?:string|null):VoiceGender|undefined{const v=(value||"").toLowerCase();return v==="male"||v==="female"?v:undefined}
export function buildTTSRequest(text:string,profile:string,language="en",voiceGender?:VoiceGender,format:"wav"|"mp3"="mp3"){const plan=getNarrationPlan(profile);return {text,language,profile:plan.profile,emotion:plan.emotion,instructions:plan.prompt,voice_gender:voiceGender,format};}
