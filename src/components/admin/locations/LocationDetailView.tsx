import React from "react";
import EnhancedMarkdown from "@/components/EnhancedMarkdown";

type LocationDoc = {
  id: string;
  name?: string;
  summary?: string;
  description?: string;
  appearance?: string;
  notableFeatures?: string;
  quote?: string; // Location quote displayed below title/image
  
  // markdown content
  descriptionMarkdown?: string;
  appearanceMarkdown?: string;
  featuresMarkdown?: string;
  
  // image
  imageUrl?: string;
};

export default function LocationDetailView({ data }: { data: LocationDoc }) {
  const summary = data.summary ?? "";
  const description = data.descriptionMarkdown ?? data.description ?? "";
  const appearance = data.appearanceMarkdown ?? data.appearance ?? "";
  const features = data.featuresMarkdown ?? data.notableFeatures ?? "";
  const quote = data.quote ?? "";

  return (
    <div className="space-y-8">
      {/* Quote - displayed at the top */}
      {quote && (
        <section>
          <p className="italic text-lg">{quote}</p>
        </section>
      )}

      {/* Summary */}
      {!!summary && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Summary</h2>
          <p>{summary}</p>
        </section>
      )}

      {/* Description */}
      {!!description && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Description</h2>
          <EnhancedMarkdown>{description}</EnhancedMarkdown>
        </section>
      )}

      {/* Appearance */}
      {!!appearance && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Appearance</h2>
          <EnhancedMarkdown>{appearance}</EnhancedMarkdown>
        </section>
      )}

      {/* Notable Features */}
      {!!features && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Notable Features</h2>
          <EnhancedMarkdown>{features}</EnhancedMarkdown>
        </section>
      )}
    </div>
  );
}
