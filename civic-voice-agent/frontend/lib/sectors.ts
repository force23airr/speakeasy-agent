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
    prompts: [
      "What's happening on the road?",
      "Any congestion now?",
      "Should I reroute traffic?",
      "Any stalled vehicles?",
      "Trend over the last few minutes?",
      "Confidence on the detection?",
    ],
  },
  {
    id: "public-safety",
    label: "Public Safety / 311",
    tagline: "non-emergency civic response",
    prompts: [
      "What did you see?",
      "Should I dispatch a unit?",
      "Severity of this?",
      "Public-facing summary?",
      "Trend over the last hour?",
      "Any pattern with past incidents?",
    ],
  },
  {
    id: "emergency",
    label: "Emergency Dispatch",
    tagline: "911 incident triage",
    prompts: [
      "What's the situation?",
      "Any injuries visible?",
      "Recommend response priority?",
      "How many people involved?",
      "Should I escalate?",
      "Confidence on the assessment?",
    ],
  },
  {
    id: "utilities",
    label: "Utilities Ops",
    tagline: "water, power & infrastructure",
    prompts: [
      "Any infrastructure issues?",
      "Status of the site?",
      "Severity of the anomaly?",
      "Dispatch a crew?",
      "Trend over the last few minutes?",
      "Recurring issues at this location?",
    ],
  },
  {
    id: "campus",
    label: "Campus Safety",
    tagline: "school & university monitoring",
    prompts: [
      "What's happening on campus?",
      "Any unauthorized activity?",
      "Severity assessment?",
      "Notify campus police?",
      "Recent activity pattern?",
      "Anything unusual about this?",
    ],
  },
  {
    id: "maritime",
    label: "Maritime / Port Ops",
    tagline: "port traffic & vessel monitoring",
    prompts: [
      "Any unusual vessel activity?",
      "Status of the dock?",
      "Anomalies in traffic patterns?",
      "Severity of the event?",
      "Recommend Coast Guard contact?",
      "Trend over the last hour?",
    ],
  },
  {
    id: "defense",
    label: "Defense / ISR",
    tagline: "intelligence, surveillance, reconnaissance · observation only",
    prompts: [
      "What's in the observation area?",
      "Last reported position of contacts?",
      "Any anomalies in the AOR?",
      "Trend over the last few minutes?",
      "Confidence on the observation?",
      "Recommend reporting to command?",
    ],
  },
];

export const DEFAULT_SECTOR_ID = "traffic";

export function getSector(id: string): Sector {
  return SECTORS.find((s) => s.id === id) ?? SECTORS[0];
}
