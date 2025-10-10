import React from "react";
import RelationPicker, { Option } from "@/components/RelationPicker";

type Props = {
  loading: boolean;
  locations: Option[];
  npcs: Option[];
  monsters: Option[];
  sessions: Option[];
  value: {
    linkedLocations: string[];
    linkedNpcs: string[];
    linkedMonsters: string[];
    linkedSessions: string[];
  };
  onChange: (patch: Record<string, any>) => void;
  onRefresh: () => void;
};

export default function LocationRelations({
  loading,
  locations,
  npcs,
  monsters,
  sessions,
  value,
  onChange,
  onRefresh,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Linked Locations */}
      <RelationPicker
        title="Related Locations"
        options={locations}
        selected={value.linkedLocations}
        onChange={(next) => onChange({ linkedLocations: next })}
        loading={loading}
        createHref="/admin/locations/new"
        onRefresh={onRefresh}
      />

      {/* Linked NPCs */}
      <RelationPicker
        title="NPCs"
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
