import { useNavigate, useParams } from "react-router-dom";
import { db, auth, storage } from "@/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { v4 as uuid } from "uuid";

import Collapsible from "@/components/admin/sessions/Collapsible";
import BasicFields from "@/components/admin/characters/BasicFields";
import MarkdownEditor from "@/components/admin/sessions/MarkdownEditor";
import PublishToggle from "@/components/admin/sessions/PublishToggle";
import ImageUpload from "@/components/admin/sessions/ImageUpload";
import { Option } from "@/components/RelationPicker";
import { useToast } from "@/ui/ToastProvider";

type AnyMap = Record<string, any>;

export default function CharacterEditor({ mode }: { mode: "create" | "edit" }) {
  const { id } = useParams();
  const col = "characters";
  const nav = useNavigate();

  // auth
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) return setIsAdmin(false);
      const r = await getDoc(doc(db, "roles", u.uid));
      setIsAdmin(r.exists() && r.data()?.admin === true);
    });
  }, []);

  const toast = useToast();

  // form state
  const [form, setForm] = useState<AnyMap>({
    name: "",
    slug: "",
    playerName: "",
    characterClass: "",
    level: "",
    race: "",
    dndbeyondUrl: "",
    abilityScores: {
      str: "",
      dex: "",
      con: "",
      int: "",
      wis: "",
      cha: "",
    },
    proficiencyBonus: "",
    savingThrows: {
      str: { proficient: false, bonus: "" },
      dex: { proficient: false, bonus: "" },
      con: { proficient: false, bonus: "" },
      int: { proficient: false, bonus: "" },
      wis: { proficient: false, bonus: "" },
      cha: { proficient: false, bonus: "" },
    },
    ac: "",
    hp: "",
    speed: "",
    gold: "",
    notesMarkdown: "",
    published: true,
    imageUrl: null as string | null,
    
    // relations
    linkedSessions: [] as string[],
    linkedCharacters: [] as string[],
  });

  const [imageFile, setImageFile] = useState<File | null>(null);

  // relation options
  const [sessionsOpts, setSessionsOpts] = useState<Option[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(false);

  // load existing doc (edit)
  useEffect(() => {
    (async () => {
      if (mode === "edit" && id) {
        const snap = await getDoc(doc(db, col, id));
        if (snap.exists()) {
          const data = snap.data();
          setForm((s) => ({
            ...s,
            ...data,
            name: data.name || "",
            slug: data.slug || "",
            playerName: data.playerName || "",
            characterClass: data.characterClass || "",
            level: data.level || "",
            race: data.race || "",
            dndbeyondUrl: data.dndbeyondUrl || "",
            abilityScores: data.abilityScores || {
              str: "",
              dex: "",
              con: "",
              int: "",
              wis: "",
              cha: "",
            },
            proficiencyBonus: data.proficiencyBonus || "",
            savingThrows: data.savingThrows ? {
              str: data.savingThrows.str || { proficient: false, bonus: "" },
              dex: data.savingThrows.dex || { proficient: false, bonus: "" },
              con: data.savingThrows.con || { proficient: false, bonus: "" },
              int: data.savingThrows.int || { proficient: false, bonus: "" },
              wis: data.savingThrows.wis || { proficient: false, bonus: "" },
              cha: data.savingThrows.cha || { proficient: false, bonus: "" },
            } : {
              str: { proficient: false, bonus: "" },
              dex: { proficient: false, bonus: "" },
              con: { proficient: false, bonus: "" },
              int: { proficient: false, bonus: "" },
              wis: { proficient: false, bonus: "" },
              cha: { proficient: false, bonus: "" },
            },
            ac: data.ac || "",
            hp: data.hp || "",
            speed: data.speed || "",
            gold: data.gold || "",
            notesMarkdown: data.notesMarkdown || "",
            imageUrl: data.imageUrl || null,
            linkedSessions: data.linkedSessions ?? [],
            linkedCharacters: data.linkedCharacters ?? [],
          }));
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    })();
  }, [mode, id]);

  // load relation options
  async function loadRelationOptions() {
    setLoadingRefs(true);

    const toOptions = (docs: any[]) =>
      docs.map((d) => {
        const data = d.data();
        return { id: d.id, label: data.title || data.name || d.id } as Option;
      });

    const [sess] = await Promise.all([
      getDocs(collection(db, "sessions")),
    ]);

    setSessionsOpts(toOptions(sess.docs));
    setLoadingRefs(false);
  }
  useEffect(() => {
    loadRelationOptions();
  }, []);

  function slugify(v: string) {
    return v.toLowerCase().replace(/[^a-z0-9\- ]/g, "").replace(/\s+/g, "-");
  }

  // Calculate ability score modifier using D&D 5e formula: (score - 10) / 2, rounded down
  function calculateModifier(score: number): string {
    if (isNaN(score)) return "0";
    const modifier = Math.floor((score - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  }

  async function save() {
    // Require a Name (slug is optional, will be derived if blank)
    const base = (form.slug || form.name || "").trim();
    if (!form.name?.trim() && !base) {
      toast.error("Please enter a Character Name.");
      return;
    }

    const slug = base ? slugify(base) : "";

    // common payload (without imageUrl; we may replace it after upload)
    const basePayload: AnyMap = {
      ...form,
      slug, // keep slug as a field for pretty links, not as doc id
      published: !!form.published,
      updatedAt: serverTimestamp(),
      createdAt: form.createdAt || serverTimestamp(),
      notesMarkdown: form.notesMarkdown || "",
    };
    Object.keys(basePayload).forEach(
      (k) => basePayload[k] === undefined && delete basePayload[k]
    );

    try {
      let targetId = id || null;

      if (mode === "edit" && targetId) {
        // Update existing doc first (without image)
        await setDoc(doc(db, col, targetId), basePayload, { merge: true });
      } else {
        // Create new doc to get an ID
        const created = await addDoc(collection(db, col), basePayload);
        targetId = created.id;
      }

      // Upload image if a new file was chosen
      let imageUrl = basePayload.imageUrl ?? null;
      if (imageFile && targetId) {
        const path = `uploads/${col}/${targetId}-${uuid()}`;
        await uploadBytes(ref(storage, path), imageFile);
        imageUrl = await getDownloadURL(ref(storage, path));
        await updateDoc(doc(db, col, targetId), {
          imageUrl,
          updatedAt: serverTimestamp(),
        });
      }

      // ✅ success toast
      toast.success("Character saved");

      // Navigate: stay in the editor (ID-based)
      nav(`/admin/${col}/${targetId}/edit`, { replace: true });
    } catch (e: any) {
      console.error(e);
      // ❌ error toast
      toast.error(e?.message || "Failed to save Character.");
    }
  }

  if (isAdmin === null) return <div>Loading…</div>;
  if (!isAdmin) {
    return (
      <div className="alert alert-error mt-6">
        <h3 className="font-bold">Access Denied</h3>
        <p>You do not have permission to edit this content.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl">
      <h1 className="text-2xl mb-4 capitalize">{mode} {col}</h1>

      <div className="flex flex-col gap-4">
        <Collapsible title="Basic Info" storageKey="sec-basics" defaultOpen>
          <BasicFields
            col={col}
            name={form.name || ""}
            slug={form.slug || ""}
            playerName={form.playerName || ""}
            characterClass={form.characterClass || ""}
            level={form.level || ""}
            race={form.race || ""}
            dndbeyondUrl={form.dndbeyondUrl || ""}
            onChange={(patch) => setForm((s) => ({ ...s, ...patch }))}
          />
        </Collapsible>

        <Collapsible title="Stats" storageKey="sec-stats" defaultOpen>
          <div className="space-y-4">
            <div className="text-sm mb-1">Ability scores with modifiers below</div>
            <div className="grid grid-cols-6 gap-2">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">STR</span>
                </label>
                <input
                  type="text"
                  value={form.abilityScores?.str || ""}
                  onChange={(e) => setForm((s) => ({ 
                    ...s, 
                    abilityScores: { 
                      ...s.abilityScores, 
                      str: e.target.value 
                    } 
                  }))}
                  className="input input-bordered w-full"
                  placeholder="10"
                />
                <div className="text-center mt-1 text-sm font-bold">
                  {form.abilityScores?.str ? 
                    calculateModifier(parseInt(form.abilityScores.str)) : 
                    "0"}
                </div>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">DEX</span>
                </label>
                <input
                  type="text"
                  value={form.abilityScores?.dex || ""}
                  onChange={(e) => setForm((s) => ({ 
                    ...s, 
                    abilityScores: { 
                      ...s.abilityScores, 
                      dex: e.target.value 
                    } 
                  }))}
                  className="input input-bordered w-full"
                  placeholder="10"
                />
                <div className="text-center mt-1 text-sm font-bold">
                  {form.abilityScores?.dex ? 
                    calculateModifier(parseInt(form.abilityScores.dex)) : 
                    "0"}
                </div>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">CON</span>
                </label>
                <input
                  type="text"
                  value={form.abilityScores?.con || ""}
                  onChange={(e) => setForm((s) => ({ 
                    ...s, 
                    abilityScores: { 
                      ...s.abilityScores, 
                      con: e.target.value 
                    } 
                  }))}
                  className="input input-bordered w-full"
                  placeholder="10"
                />
                <div className="text-center mt-1 text-sm font-bold">
                  {form.abilityScores?.con ? 
                    calculateModifier(parseInt(form.abilityScores.con)) : 
                    "0"}
                </div>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">INT</span>
                </label>
                <input
                  type="text"
                  value={form.abilityScores?.int || ""}
                  onChange={(e) => setForm((s) => ({ 
                    ...s, 
                    abilityScores: { 
                      ...s.abilityScores, 
                      int: e.target.value 
                    } 
                  }))}
                  className="input input-bordered w-full"
                  placeholder="10"
                />
                <div className="text-center mt-1 text-sm font-bold">
                  {form.abilityScores?.int ? 
                    calculateModifier(parseInt(form.abilityScores.int)) : 
                    "0"}
                </div>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">WIS</span>
                </label>
                <input
                  type="text"
                  value={form.abilityScores?.wis || ""}
                  onChange={(e) => setForm((s) => ({ 
                    ...s, 
                    abilityScores: { 
                      ...s.abilityScores, 
                      wis: e.target.value 
                    } 
                  }))}
                  className="input input-bordered w-full"
                  placeholder="10"
                />
                <div className="text-center mt-1 text-sm font-bold">
                  {form.abilityScores?.wis ? 
                    calculateModifier(parseInt(form.abilityScores.wis)) : 
                    "0"}
                </div>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">CHA</span>
                </label>
                <input
                  type="text"
                  value={form.abilityScores?.cha || ""}
                  onChange={(e) => setForm((s) => ({ 
                    ...s, 
                    abilityScores: { 
                      ...s.abilityScores, 
                      cha: e.target.value 
                    } 
                  }))}
                  className="input input-bordered w-full"
                  placeholder="10"
                />
                <div className="text-center mt-1 text-sm font-bold">
                  {form.abilityScores?.cha ? 
                    calculateModifier(parseInt(form.abilityScores.cha)) : 
                    "0"}
                </div>
              </div>
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-semibold">Proficiency Bonus</span>
              </label>
              <input
                type="text"
                value={form.proficiencyBonus || ""}
                onChange={(e) => setForm((s) => ({ ...s, proficiencyBonus: e.target.value }))}
                className="input input-bordered w-full max-w-xs"
                placeholder="+"
              />
            </div>

            <div className="mb-4">
              <label className="label">
                <span className="label-text font-semibold">Saving Throws</span>
              </label>
              <div className="grid grid-cols-3 gap-4">
                {["str", "dex", "con", "int", "wis", "cha"].map((ability) => {
                  const savingThrow = form.savingThrows?.[ability as keyof typeof form.savingThrows] || { proficient: false, bonus: "" };
                  return (
                    <div key={ability} className="form-control border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="label-text uppercase font-semibold">{ability}</span>
                        <label className="label cursor-pointer justify-end gap-2 m-0 p-0">
                          <span className="label-text text-xs">Proficient</span>
                          <input
                            type="checkbox"
                            checked={savingThrow.proficient}
                            onChange={(e) => setForm((s) => ({
                              ...s,
                              savingThrows: {
                                ...s.savingThrows,
                                [ability]: {
                                  ...s.savingThrows[ability as keyof typeof s.savingThrows],
                                  proficient: e.target.checked
                                }
                              }
                            }))}
                            className="checkbox checkbox-primary checkbox-sm"
                          />
                        </label>
                      </div>
                      <div className="form-control">
                        <label className="label p-0">
                          <span className="label-text text-xs">Background Bonus</span>
                          <span className="label-text-alt text-xs text-info">e.g., Criminal</span>
                        </label>
                        <input
                          type="text"
                          value={savingThrow.bonus || ""}
                          onChange={(e) => setForm((s) => ({
                            ...s,
                            savingThrows: {
                              ...s.savingThrows,
                              [ability]: {
                                ...s.savingThrows[ability as keyof typeof s.savingThrows],
                                bonus: e.target.value
                              }
                            }
                          }))}
                          className="input input-bordered input-sm w-full"
                          placeholder="+"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">AC</span>
                </label>
                <input
                  type="text"
                  value={form.ac || ""}
                  onChange={(e) => setForm((s) => ({ ...s, ac: e.target.value }))}
                  className="input input-bordered w-full"
                  placeholder="10"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">HP</span>
                </label>
                <input
                  type="text"
                  value={form.hp || ""}
                  onChange={(e) => setForm((s) => ({ ...s, hp: e.target.value }))}
                  className="input input-bordered w-full"
                  placeholder="8"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Speed</span>
                </label>
                <input
                  type="text"
                  value={form.speed || ""}
                  onChange={(e) => setForm((s) => ({ ...s, speed: e.target.value }))}
                  className="input input-bordered w-full"
                  placeholder="30 ft"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Gold</span>
                </label>
                <input
                  type="text"
                  value={form.gold || ""}
                  onChange={(e) => setForm((s) => ({ ...s, gold: e.target.value }))}
                  className="input input-bordered w-full"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </Collapsible>

        <Collapsible title="Notes" storageKey="sec-notes" defaultOpen>
          <MarkdownEditor
            value={form.notesMarkdown || ""}
            onChange={(v) => setForm((s) => ({ ...s, notesMarkdown: v }))}
          />
        </Collapsible>

        <Collapsible title="Image" storageKey="sec-image">
          <ImageUpload onFile={setImageFile} currentUrl={form.imageUrl} />
        </Collapsible>

        <Collapsible title="Publish" storageKey="sec-publish">
          <PublishToggle
            published={!!form.published}
            onChange={(v) => setForm((s) => ({ ...s, published: v }))}
          />
        </Collapsible>

        <div className="pt-2">
          <button className="btn btn-primary" onClick={save}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
