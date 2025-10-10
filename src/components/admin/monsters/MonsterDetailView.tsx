import React from "react";
import EnhancedMarkdown from "@/components/EnhancedMarkdown";
import { Link } from "react-router-dom";

type MonsterDoc = {
  id: string;
  name?: string;
  type?: string;
  appearance?: string;
  notableDetails?: string;
  knownEncounters?: string;
  firstAppearance?: string; // Session ID
  deceased?: boolean;
  quote?: string; // Monster quote displayed below title/image
  
  // markdown content
  appearanceMarkdown?: string;
  detailsMarkdown?: string;
  encountersMarkdown?: string;
  
  // image
  imageUrl?: string;
};

export default function MonsterDetailView({ data }: { data: MonsterDoc }) {
  const appearance = data.appearanceMarkdown ?? data.appearance ?? "";
  const details = data.detailsMarkdown ?? data.notableDetails ?? "";
  const encounters = data.encountersMarkdown ?? data.knownEncounters ?? "";
  const firstAppearanceId = data.firstAppearance;
  const isDeceased = data.deceased === true;
  const quote = data.quote ?? "";

  return (
    <div className="space-y-8">
      {/* Quote - displayed at the top */}
      {quote && (
        <section>
          <p className="italic text-lg">{quote}</p>
        </section>
      )}

      {/* Type */}
      {data.type && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Type</h2>
          <p>{data.type}</p>
        </section>
      )}

      {/* Appearance */}
      {!!appearance && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Appearance</h2>
          <EnhancedMarkdown>{appearance}</EnhancedMarkdown>
        </section>
      )}

      {/* Notable Details */}
      {!!details && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Notable Details</h2>
          <EnhancedMarkdown>{details}</EnhancedMarkdown>
        </section>
      )}

      {/* Known Encounters */}
      {!!encounters && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Known Encounters</h2>
          <EnhancedMarkdown>{encounters}</EnhancedMarkdown>
        </section>
      )}

      {/* First Appearance */}
      {firstAppearanceId && (
        <section>
          <h2 className="text-xl font-semibold mb-2">First Appearance</h2>
          <Link to={`/sessions/${firstAppearanceId}`} className="link">
            View Session
          </Link>
        </section>
      )}
    </div>
  );
}
