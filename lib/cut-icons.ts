/**
 * Maps cut name to icon filename (without .svg) in public/icons/cuts/.
 * ground beef → ground.svg, ribeye steak → ribeye.svg, etc.
 */
const CUT_NAME_TO_ICON: Record<string, string> = {
  "ground beef": "ground",
  "ribeye steak": "ribeye",
  ribeye: "ribeye",
  "sirloin steak": "sirloin",
  sirloin: "sirloin",
  "filet mignon": "filet",
  filet: "filet",
  skirt: "skirt",
  tritip: "tritip",
  "porterhouse steak": "porterhouse",
  porterhouse: "porterhouse",
  "round steak": "round",
  round: "round",
  "t-bone steak": "tbone",
  "t-bone": "tbone",
  tbone: "tbone",
  "new york strip": "sirloin 2",
  roasts: "chuck roast",
  "arm roast": "arm roast",
  "chuck roast": "chuck roast",
  "rump roast": "rump roast",
  "sirloin tip roast": "sirloin tip roast",
  "sirloin tip": "sirloin tip roast",
  "beef ribs": "beef ribs",
  "beef rib": "beef ribs",
  ribs: "beef ribs",
};

export function getCutIconSlug(item: { cut_id: string; cut_name: string }): string {
  const normalized = item.cut_name.toLowerCase().trim();
  return CUT_NAME_TO_ICON[normalized] ?? "default";
}

/** Public URL for the cut icon (encodes spaces in filenames like `arm roast.svg`). */
export function getCutIconPath(item: { cut_id: string; cut_name: string }): string {
  const slug = getCutIconSlug(item);
  return `/icons/cuts/${encodeURIComponent(slug)}.svg`;
}
