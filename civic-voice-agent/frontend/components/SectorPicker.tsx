"use client";

import { SECTORS } from "@/lib/sectors";

interface Props {
  value: string;
  onChange: (id: string) => void;
}

export default function SectorPicker({ value, onChange }: Props) {
  return (
    <select
      className="select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Sector"
    >
      {SECTORS.map((s) => (
        <option key={s.id} value={s.id}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
