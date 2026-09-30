export type NarrationProfile =
  | "default"
  | "scripture"
  | "mythology"
  | "folklore"
  | "ghost"
  | "kids"
  | "moral-tale";

export const NARRATION_PROFILE_BY_CONTENT: Record<string, NarrationProfile> = {
  scripture: "scripture",
  translation: "scripture",
  commentary: "scripture",
  mythology: "mythology",
  folklore: "folklore",
  "ghost-story": "ghost",
  "moral-tale": "moral-tale",
  story: "mythology",
  biography: "folklore",
};

export function narrationProfileFor(contentType?: string, audience?: string): NarrationProfile {
  if (audience === "kids") return "kids";
  return NARRATION_PROFILE_BY_CONTENT[contentType || ""] || "default";
}
