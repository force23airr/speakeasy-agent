export interface LiveDetection {
  category: string;
  confidence: number;
  summary: string;
  at: string;
}

const MAX = 20;
const buffer: LiveDetection[] = [];

export function record(d: Omit<LiveDetection, "at">): LiveDetection {
  const entry: LiveDetection = { ...d, at: new Date().toISOString() };
  buffer.push(entry);
  if (buffer.length > MAX) buffer.shift();
  return entry;
}

export function current(): LiveDetection | null {
  return buffer[buffer.length - 1] ?? null;
}

export function recent(n = 10): LiveDetection[] {
  return buffer.slice(-n).reverse();
}
