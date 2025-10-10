import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/firebase";
import { useIsAdmin } from "@/hooks/useIsAdmin";

type Item = {
  id: string;
  slug?: string;
  title?: string;
  name?: string;
  date?: string;       // "YYYY-MM-DD"
  summary?: string;
  imageUrl?: string;
  published?: boolean;
  deceased?: boolean;
  linkedSessions?: string[];
  firstAppearance?: string;
};

type SessionOption = {
  id: string;
  title: string;
};

const LABELS: Record<string, string> = {
  sessions: "Sessions",
  npcs: "NPCs",
  monsters: "Monsters",
  locations: "Locations",
  characters: "Characters",
};

const titleFor = (col: string) => LABELS[col] ?? col;

export default function ListPage({ collection: col }: { collection: string }) {
  const { isAdmin } = useIsAdmin();
  // Force isAdmin to be a boolean (false if null)
  const safeIsAdmin = isAdmin === true;
  
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");

  // sessions only: sort newest/oldest
  const isSessions = col === "sessions";
  const [sortMode, setSortMode] = useState<"newest" | "oldest">("newest");

  const sortDir = useMemo(() => (sortMode === "newest" ? "desc" : "asc"), [sortMode]);

  // Load sessions for filter dropdown
  useEffect(() => {
    if (isSessions) return; // Don't need to load sessions when viewing sessions
    
    let cancelled = false;
    (async () => {
      try {
        const sessionsRef = collection(db, "sessions");
        
        // Get all sessions
        const sessionsQuery = query(sessionsRef);
        const sessionsSnap = await getDocs(sessionsQuery);
        
        // Get all sessions with their data
        const allSessions = sessionsSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || doc.id,
            published: data.published
          };
        });
        
        // Filter for published sessions client-side
        const publishedSessions = allSessions.filter(s => s.published === true);
        
        // Format for dropdown
        const sessionsList = publishedSessions.map(s => ({
          id: s.id,
          title: s.title
        }));
        
        if (!cancelled) {
          setSessions(sessionsList);
        }
      } catch (err) {
        console.error("Error loading sessions for filter:", err);
      }
    })();
    
    return () => {
      cancelled = true;
    };
  }, [isSessions]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);

      const ref = collection(db, col);

      try {
        let snap;

        // Build base query: admins see all; public sees published only
        // Try to push sorting to Firestore; if that fails (missing index/field),
        // we’ll sort client-side below.
        if (isSessions) {
          // Sessions: by date asc/desc
          if (safeIsAdmin) {
            try {
              snap = await getDocs(query(ref, orderBy("date", sortDir as any)));
            } catch {
              snap = await getDocs(ref);
            }
          } else {
            try {
              snap = await getDocs(query(ref, where("published", "==", true), orderBy("date", sortDir as any)));
            } catch {
              snap = await getDocs(query(ref, where("published", "==", true)));
            }
          }
        } else {
          // NPCs / Monsters / Locations / Characters: A→Z by title/name
          // For NPCs, Monsters, Locations, and Characters, we need to sort by name field
          const sortField = col === "npcs" || col === "locations" || col === "monsters" || col === "characters" ? "name" : "title";
          
          if (safeIsAdmin) {
            try {
              snap = await getDocs(query(ref, orderBy(sortField, "asc")));
            } catch {
              snap = await getDocs(ref);
            }
          } else {
            try {
              snap = await getDocs(query(ref, where("published", "==", true), orderBy(sortField, "asc")));
            } catch {
              snap = await getDocs(query(ref, where("published", "==", true)));
            }
          }
        }

        let docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Item[];

        // Client-side fallback sort to guarantee order even without indexes
        if (isSessions) {
          docs.sort((a, b) => {
            const ad = a.date || "";
            const bd = b.date || "";
            // YYYY-MM-DD string compare works for chronological sort
            return sortDir === "desc" ? bd.localeCompare(ad) : ad.localeCompare(bd);
          });
        } else {
          docs.sort((a, b) => {
            const at = (a.title || a.name || "").toLowerCase();
            const bt = (b.title || b.name || "").toLowerCase();
            return at.localeCompare(bt);
          });
        }

        if (!safeIsAdmin) {
          // Ensure public list only shows published (in case of client fallback)
          docs = docs.filter((d) => d.published === true);
        }

        // Filter by selected session if applicable
        if (selectedSession && !isSessions) {
          docs = docs.filter(item => {
            return item.linkedSessions?.includes(selectedSession) || 
                   item.firstAppearance === selectedSession;
          });
        }

        if (!cancelled) {
          setItems(docs);
          setLoading(false);
        }
      } catch (err) {
        console.error("List fetch error:", err);
        if (!cancelled) {
          setItems([]);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [col, safeIsAdmin, isSessions, sortDir, selectedSession]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">{titleFor(col)}</h1>

        <div className="flex flex-wrap gap-2">
          {/* Session filter for NPCs, monsters, Locations */}
          {!isSessions && sessions.length > 0 && (
            <div className="form-control">
              <div className="flex flex-wrap items-center gap-2">
                <label className="label-text text-sm whitespace-nowrap">Filter by session:</label>
                <select
                  className="select select-bordered select-sm max-w-[180px] sm:max-w-[220px]"
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                >
                  <option value="">All Sessions</option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.title}
                    </option>
                  ))}
                </select>
                {selectedSession && (
                  <button 
                    className="btn btn-ghost btn-xs" 
                    onClick={() => setSelectedSession("")}
                    title="Clear filter"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Sessions sort toggle */}
          {isSessions && (
            <div className="join self-start">
              <button
                className={`btn btn-sm join-item ${sortMode === "newest" ? "btn-primary" : ""}`}
                onClick={() => setSortMode("newest")}
              >
                Newest
              </button>
              <button
                className={`btn btn-sm join-item ${sortMode === "oldest" ? "btn-primary" : ""}`}
                onClick={() => setSortMode("oldest")}
              >
                Oldest
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : items.length === 0 ? (
        <div>
          {selectedSession ? (
            <div>No {titleFor(col).toLowerCase()} found for the selected session.</div>
          ) : (
            <div>No {titleFor(col).toLowerCase()} found.</div>
          )}
        </div>
      ) : (
        <>
          {selectedSession && (
            <div className="mb-4 text-sm opacity-70">
              Showing {items.length} {items.length === 1 ? titleFor(col).toLowerCase().slice(0, -1) : titleFor(col).toLowerCase()} from the selected session.
            </div>
          )}
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((it) => {
            const t = it.title || it.name || it.id;
            return (
              <Link to={`/${col}/${it.slug || it.id}`} key={it.id} className="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer">
                <div className="card-body">
                  <div className="flex justify-between items-start">
                    <h3 className="card-title">{t}</h3>
                    {(col === "npcs" || col === "monsters") && it.deceased && (
                      <span className="text-error font-semibold">DECEASED</span>
                    )}
                  </div>
                  {it.summary && <p className="opacity-80">{it.summary}</p>}
                  {it.date && <p className="text-sm opacity-60">{new Date(it.date).toLocaleDateString()}</p>}
                  <div className="text-sm mt-2 text-primary">Read full entry →</div>
                </div>
              </Link>
            );
          })}
        </div>
        </>
      )}
    </div>
  );
}
