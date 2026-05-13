export interface Sector {
  id: string;
  label: string;
  tagline: string;
  prompts: string[];
}

export const SECTORS: Sector[] = [
  {
    id: "traffic",
    label: "Traffic Operations",
    tagline: "roadway monitoring & incident dispatch",
    prompts: ["What's happening?", "Any congestion?", "Confidence?"],
  },
  {
    id: "public-safety",
    label: "Public Safety / 311",
    tagline: "non-emergency civic response",
    prompts: ["What did you see?", "Should I dispatch?", "Severity?"],
  },
  {
    id: "emergency",
    label: "Emergency Dispatch",
    tagline: "911 incident triage",
    prompts: [
      "What's the situation?",
      "Any injuries visible?",
      "Recommend response?",
    ],
  },
  {
    id: "utilities",
    label: "Utilities Ops",
    tagline: "water, power & infrastructure",
    prompts: ["Any outages observed?", "Status?", "Severity?"],
  },
  {
    id: "campus",
    label: "Campus Safety",
    tagline: "school & university monitoring",
    prompts: ["What's happening?", "Any unauthorized activity?", "Severity?"],
  },
  {
    id: "maritime",
    label: "Maritime / Port Ops",
    tagline: "port traffic & vessel monitoring",
    prompts: ["Vessel activity?", "Any anomalies?", "Status?"],
  },
];

export const DEFAULT_SECTOR_ID = "traffic";

export function getSector(id: string): Sector {
  return SECTORS.find((s) => s.id === id) ?? SECTORS[0];
}
