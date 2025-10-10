import RelationPicker, { Option } from "@/components/RelationPicker";
import Collapsible from "./Collapsible";

export default function SessionRelations({
  loading,
  locations,
  npcs,
  monsters,
  sessions,
  value,
  onChange,
  onRefresh,
}: {
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
  onChange: (patch: Partial<typeof value>) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="grid gap-4">
      <Collapsible title="Linked Locations" storageKey="rel-locations" defaultOpen>
        <RelationPicker
          title=""
          options={locations}
          selected={value.linkedLocations}
          onChange={(next) => onChange({ linkedLocations: next })}
          loading={loading}
          createHref="/admin/locations/new"
          onRefresh={onRefresh}
        />
      </Collapsible>

      <Collapsible title="Linked NPCs" storageKey="rel-npcs" defaultOpen>
        <RelationPicker
          title=""
          options={npcs}
          selected={value.linkedNpcs}
          onChange={(next) => onChange({ linkedNpcs: next })}
          loading={loading}
          createHref="/admin/npcs/new"
          onRefresh={onRefresh}
        />
      </Collapsible>

      <Collapsible title="Linked Monsters" storageKey="rel-monsters">
        <RelationPicker
          title=""
          options={monsters}
          selected={value.linkedMonsters}
          onChange={(next) => onChange({ linkedMonsters: next })}
          loading={loading}
          createHref="/admin/monsters/new"
          onRefresh={onRefresh}
        />
      </Collapsible>

      <Collapsible title="Related Sessions" storageKey="rel-sessions">
        <RelationPicker
          title=""
          options={sessions}
          selected={value.linkedSessions}
          onChange={(next) => onChange({ linkedSessions: next })}
          loading={loading}
          createHref="/admin/sessions/new"
          onRefresh={onRefresh}
        />
      </Collapsible>
    </div>
  );
}
