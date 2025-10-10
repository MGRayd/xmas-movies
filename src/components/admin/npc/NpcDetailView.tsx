import React from "react";
import EnhancedMarkdown from "@/components/EnhancedMarkdown";
import { Link } from "react-router-dom";

type NpcDoc = {
  id: string;
  name?: string;
  role?: string;
  appearance?: string;
  notableDetails?: string;
  firstAppearance?: string; // Session ID
  deceased?: boolean;
  quote?: string; // Character quote displayed below title/image
  
  // markdown content
  appearanceMarkdown?: string;
  detailsMarkdown?: string;
  
  // image
  imageUrl?: string;
};

export default function NpcDetailView({ data }: { data: NpcDoc }) {
  const appearance = data.appearanceMarkdown ?? data.appearance ?? "";
  const details = data.detailsMarkdown ?? data.notableDetails ?? "";
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

      {/* Role */}
      {data.role && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Role</h2>
          <p>{data.role}</p>
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
