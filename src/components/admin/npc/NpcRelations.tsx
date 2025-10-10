import React from "react";
import RelationPicker, { Option } from "@/components/RelationPicker";

type Props = {
  loading: boolean;
  locations: Option[];
  npcs: Option[];
  monsters: Option[];
  sessions: Option[];
  firstAppearance: string | null;
  value: {
    linkedLocations: string[];
    linkedNpcs: string[];
    linkedMonsters: string[];
    linkedSessions: string[];
  };
  onChange: (patch: Record<string, any>) => void;
  onRefresh: () => void;
};

export default function NpcRelations({
  loading,
  locations,
  npcs,
  monsters,
  sessions,
  firstAppearance,
  value,
  onChange,
  onRefresh,
}: Props) {
  return (
    <div className="space-y-4">
      {/* First Appearance */}
      <div className="form-control">
        <label className="label">
          <span className="label-text">First Appearance</span>
        </label>
        <select
          className="select select-bordered w-full"
          value={firstAppearance || ""}
          onChange={(e) => onChange({ firstAppearance: e.target.value || null })}
        >
          <option value="">Select a session...</option>
          {[...sessions]
            .sort((a, b) => {
              // Sort sessions numerically by session number
              if (a.label.startsWith('Session-') && b.label.startsWith('Session-')) {
                const numA = parseInt(a.label.replace('Session-', ''), 10) || 0;
                const numB = parseInt(b.label.replace('Session-', ''), 10) || 0;
                return numA - numB;
              }
              // Default alphabetical sort
              return a.label.localeCompare(b.label);
            })
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))
          }
        </select>
      </div>

      {/* Linked Locations */}
      <RelationPicker
        title="Locations"
        options={locations}
        selected={value.linkedLocations}
        onChange={(next) => onChange({ linkedLocations: next })}
        loading={loading}
        createHref="/admin/locations/new"
        onRefresh={onRefresh}
      />

      {/* Linked NPCs */}
      <RelationPicker
        title="Related NPCs"
        options={npcs}
        selected={value.linkedNpcs}
        onChange={(next) => onChange({ linkedNpcs: next })}
        loading={loading}
        createHref="/admin/npcs/new"
        onRefresh={onRefresh}
      />

      {/* Linked Monsters */}
      <RelationPicker
        title="Monsters"
        options={monsters}
        selected={value.linkedMonsters}
        onChange={(next) => onChange({ linkedMonsters: next })}
        loading={loading}
        createHref="/admin/monsters/new"
        onRefresh={onRefresh}
      />

      {/* Linked Sessions */}
      <RelationPicker
        title="Sessions"
        options={sessions}
        selected={value.linkedSessions}
        onChange={(next) => onChange({ linkedSessions: next })}
        loading={loading}
        createHref="/admin/sessions/new"
        onRefresh={onRefresh}
      />
    </div>
  );
}
