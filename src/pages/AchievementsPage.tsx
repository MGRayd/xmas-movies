import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { ACHIEVEMENTS, checkAndUnlockAchievements } from '../achievements';

interface AchievementDocData {
  unlockedAt?: any;
  seen?: boolean;
}

interface AchievementWithState {
  id: string;
  name: string;
  description: string;
  hint: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date | null;
}

const AchievementsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AchievementWithState[]>([]);

  useEffect(() => {
    const run = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        await checkAndUnlockAchievements(currentUser.uid);
        const col = collection(db, `users/${currentUser.uid}/achievements`);
        const snap = await getDocs(col);
        const unlockedMap = new Map<string, { unlockedAt?: Date | null; seen?: boolean }>();

        snap.forEach((docSnap) => {
          const data = docSnap.data() as AchievementDocData;
          let unlockedAt: Date | null = null;
          if (data.unlockedAt instanceof Date) {
            unlockedAt = data.unlockedAt;
          } else if (data.unlockedAt && typeof (data.unlockedAt as any).toDate === 'function') {
            unlockedAt = (data.unlockedAt as any).toDate();
          }
          unlockedMap.set(docSnap.id, {
            unlockedAt,
            seen: data.seen,
          });
        });

        const merged: AchievementWithState[] = ACHIEVEMENTS.map((a) => {
          const unlocked = unlockedMap.get(a.id);
          return {
            id: a.id,
            name: a.name,
            description: a.description,
            hint: a.hint,
            icon: a.icon,
            unlocked: !!unlocked,
            unlockedAt: unlocked?.unlockedAt ?? null,
          };
        }).sort((a, b) => {
          if (a.unlocked === b.unlocked) {
            return a.name.localeCompare(b.name);
          }
          return a.unlocked ? -1 : 1;
        });

        setItems(merged);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-xmas-gold"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-xmas-gold"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-christmas text-3xl md:text-4xl text-xmas-line mb-2">Achievements</h1>
          <p className="text-sm text-xmas-text/80">
            Unlock festive badges as you watch, rate and explore your Christmas movies.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((a) => (
          <div
            key={a.id}
            className={
              'rounded-lg p-4 shadow-lg border transition-transform bg-xmas-card ' +
              (a.unlocked
                ? 'border-xmas-gold hover:scale-[1.02]'
                : 'border-gray-700 opacity-70')
            }
          >
            <div className="flex items-center mb-3">
              <div
                className={
                  'text-3xl mr-3 flex items-center justify-center w-12 h-12 rounded-full ' +
                  (a.unlocked ? 'bg-xmas-gold/20' : 'bg-gray-700')
                }
              >
                <span>{a.icon}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  {a.name}
                  {a.unlocked && (
                    <span className="badge badge-success badge-sm">Unlocked</span>
                  )}
                </h2>
                {a.unlocked && a.unlockedAt && (
                  <p className="text-xs text-xmas-text/70 mt-1">
                    Unlocked on{' '}
                    {a.unlockedAt.toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </div>

            <p className="text-sm text-xmas-text mb-3">
              {a.unlocked ? a.description : a.hint}
            </p>

            {!a.unlocked && (
              <p className="text-xs text-xmas-text/60 italic">
                Locked – keep watching to reveal this badge.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AchievementsPage;
