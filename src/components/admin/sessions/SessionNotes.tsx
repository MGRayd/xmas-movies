import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  serverTimestamp, 
  setDoc, 
  query, 
  orderBy, 
  where,
  updateDoc,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/firebase';
import { useToast } from '@/ui/ToastProvider';
import MarkdownEditor from './MarkdownEditor';
import RelationPicker, { Option } from '@/components/RelationPicker';
import Collapsible from './Collapsible';

type SessionNote = {
  id?: string;
  sessionId?: string; // Make sessionId optional
  title: string;
  content: string;
  createdAt: any;
  updatedAt: any;
  // Add a field to track if this is a draft note (not yet associated with a session)
  isDraft?: boolean;
  // Relationship fields
  linkedLocations?: string[];
  linkedNpcs?: string[];
  linkedMonsters?: string[];
  linkedSessions?: string[];
};

type Session = {
  id: string;
  title: string;
  date: string;
};

export default function SessionNotes() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();

  // Auth state
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) return setIsAdmin(false);
      const r = await getDoc(doc(db, 'roles', u.uid));
      setIsAdmin(r.exists() && r.data()?.admin === true);
    });
  }, []);

  // State for notes
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [draftNotes, setDraftNotes] = useState<SessionNote[]>([]);
  const [currentNote, setCurrentNote] = useState<SessionNote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(id || null);
  const [loading, setLoading] = useState(true);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  
  // State for relationships
  const [locationsOpts, setLocationsOpts] = useState<Option[]>([]);
  const [npcsOpts, setNpcsOpts] = useState<Option[]>([]);
  const [monstersOpts, setMonstersOpts] = useState<Option[]>([]);
  const [sessionsOpts, setSessionsOpts] = useState<Option[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(false);

  // Load relationship options
  const loadRelationOptions = async () => {
    setLoadingRefs(true);

    const toOptions = (docs: any[]) =>
      docs.map((d) => {
        const data = d.data();
        return { id: d.id, label: data.title || data.name || d.id } as Option;
      });

    try {
      const [locs, npcs, mons, sess] = await Promise.all([
        getDocs(collection(db, "locations")),
        getDocs(collection(db, "npcs")),
        getDocs(collection(db, "monsters")),
        getDocs(collection(db, "sessions")),
      ]);

      setLocationsOpts(toOptions(locs.docs));
      setNpcsOpts(toOptions(npcs.docs));
      setMonstersOpts(toOptions(mons.docs));
      setSessionsOpts(toOptions(sess.docs));
    } catch (err) {
      console.error("Error loading relationship options:", err);
      toast.error("Failed to load relationship options");
    } finally {
      setLoadingRefs(false);
    }
  };

  // Load relationships when component mounts
  useEffect(() => {
    loadRelationOptions();
  }, []);

  // Load sessions for dropdown
  useEffect(() => {
    let isMounted = true;
    const loadSessions = async () => {
      try {
        const sessionsRef = collection(db, 'sessions');
        const sessionsQuery = query(sessionsRef, orderBy('date', 'desc'));
        const sessionsSnap = await getDocs(sessionsQuery);
        
        const sessionsList = sessionsSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || doc.id,
            date: data.date || ''
          };
        });
        
        if (isMounted) {
          setSessions(sessionsList);
        }
      } catch (err) {
        console.error('Error loading sessions:', err);
        if (isMounted) {
          toast.error('Failed to load sessions');
        }
      }
    };
    
    loadSessions();
    return () => { isMounted = false; };
  }, []);

  // Load draft notes (notes without a sessionId or with isDraft=true)
  useEffect(() => {
    let isMounted = true;
    const loadDraftNotes = async () => {
      if (isMounted) {
        setLoadingDrafts(true);
      }
      
      try {
        const notesRef = collection(db, 'sessionNotes');
        
        // Query for notes explicitly marked as drafts
        const draftQuery = query(
          notesRef,
          where('isDraft', '==', true),
          orderBy('createdAt', 'desc')
        );
        
        const draftSnap = await getDocs(draftQuery);
        const draftsList = draftSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as SessionNote));
        
        if (isMounted) {
          setDraftNotes(draftsList);
        }
      } catch (err) {
        console.error('Error loading draft notes:', err);
        if (isMounted) {
          toast.error('Failed to load draft notes');
        }
      } finally {
        if (isMounted) {
          setLoadingDrafts(false);
        }
      }
    };
    
    loadDraftNotes();
    return () => { isMounted = false; };
  }, []);

  // Load notes for selected session
  useEffect(() => {
    let isMounted = true;
    const loadNotes = async () => {
      if (!selectedSession) {
        if (isMounted) {
          setNotes([]);
          setLoading(false);
        }
        return;
      }

      if (isMounted) {
        setLoading(true);
      }
      
      try {
        const notesRef = collection(db, 'sessionNotes');
        // Query for notes linked to this session
        // This will include both notes that were created for this session
        // and draft notes that were later linked to this session
        const notesQuery = query(
          notesRef, 
          where('sessionId', '==', selectedSession),
          orderBy('createdAt', 'desc')
        );
        
        const notesSnap = await getDocs(notesQuery);
        const notesList = notesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as SessionNote));
        
        if (isMounted) {
          console.log(`Found ${notesList.length} notes for session ${selectedSession}`);
          setNotes(notesList);
        }
      } catch (err) {
        console.error('Error loading notes:', err);
        if (isMounted) {
          toast.error('Failed to load notes');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadNotes();
    return () => { isMounted = false; };
  }, [selectedSession]);

  // Create a new note
  const createNewNote = () => {
    // Reset all relationship collapsible sections to closed
    try {
      localStorage.setItem("note-rel-locations", "0");
      localStorage.setItem("note-rel-npcs", "0");
      localStorage.setItem("note-rel-monsters", "0");
      localStorage.setItem("note-rel-sessions", "0");
    } catch {}
    
    let newNote: SessionNote;
    
    if (selectedSession) {
      // If a session is selected, create a note for that session
      const session = sessions.find(s => s.id === selectedSession);
      const sessionTitle = session ? session.title : 'Unknown Session';
      
      newNote = {
        sessionId: selectedSession,
        title: `Notes for ${sessionTitle}`,
        content: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Initialize relationship fields
        linkedLocations: [],
        linkedNpcs: [],
        linkedMonsters: [],
        linkedSessions: []
      };
    } else {
      // Create a draft note without a session
      newNote = {
        title: `Draft Notes - ${new Date().toLocaleDateString()}`,
        content: '',
        isDraft: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        // Initialize relationship fields
        linkedLocations: [],
        linkedNpcs: [],
        linkedMonsters: [],
        linkedSessions: []
      };
    }

    setCurrentNote(newNote);
    setIsEditing(true);
  };

  // Edit an existing note
  const editNote = (note: SessionNote) => {
    // Reset all relationship collapsible sections to closed
    try {
      localStorage.setItem("note-rel-locations", "0");
      localStorage.setItem("note-rel-npcs", "0");
      localStorage.setItem("note-rel-monsters", "0");
      localStorage.setItem("note-rel-sessions", "0");
    } catch {}
    
    setCurrentNote(note);
    setIsEditing(true);
  };

  // Save the current note
  const saveNote = async () => {
    if (!currentNote) return;

    try {
      const noteData = {
        ...currentNote,
        updatedAt: serverTimestamp()
      };

      if (currentNote.id) {
        // Update existing note
        await updateDoc(doc(db, 'sessionNotes', currentNote.id), noteData);
        toast.success('Note updated successfully');
      } else {
        // Create new note
        await addDoc(collection(db, 'sessionNotes'), noteData);
        toast.success('Note created successfully');
      }

      // Set editing state to false first to avoid race conditions
      setIsEditing(false);
      setCurrentNote(null);
      
      // Reload the appropriate notes list based on whether this is a draft or session note
      const notesRef = collection(db, 'sessionNotes');
      
      if (noteData.isDraft) {
        // Reload draft notes
        const draftQuery = query(
          notesRef,
          where('isDraft', '==', true),
          orderBy('createdAt', 'desc')
        );
        
        const draftSnap = await getDocs(draftQuery);
        const draftsList = draftSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as SessionNote));
        
        setDraftNotes(draftsList);
      } else if (selectedSession) {
        // Reload session notes
        const notesQuery = query(
          notesRef, 
          where('sessionId', '==', selectedSession),
          orderBy('createdAt', 'desc')
        );
        
        const notesSnap = await getDocs(notesQuery);
        const notesList = notesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as SessionNote));
        
        setNotes(notesList);
      }
    } catch (err) {
      console.error('Error saving note:', err);
      toast.error('Failed to save note');
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setCurrentNote(null);
  };

  // Delete a note
  const deleteNote = async (note: SessionNote) => {
    if (!note.id) return;
    
    if (!window.confirm(`Are you sure you want to delete the note "${note.title}"?`)) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'sessionNotes', note.id));
      toast.success('Note deleted successfully');
      
      // Refresh the appropriate list
      if (note.isDraft) {
        setDraftNotes(prev => prev.filter(n => n.id !== note.id));
      } else if (note.sessionId === selectedSession) {
        setNotes(prev => prev.filter(n => n.id !== note.id));
      }
    } catch (err) {
      console.error('Error deleting note:', err);
      toast.error('Failed to delete note');
    }
  };
  
  // Create a new session from notes
  const createSessionFromNotes = (note: SessionNote) => {
    nav(`/admin/sessions/new?noteId=${note.id}`);
  };

  if (isAdmin === null) return <div>Loading…</div>;
  if (!isAdmin) {
    return (
      <div className="alert alert-error mt-6">
        <h3 className="font-bold">Access Denied</h3>
        <p>You do not have permission to view session notes.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <h1 className="text-3xl font-bold mb-6">Session Notes</h1>

      {/* Session selector - Optional */}
      <div className="form-control mb-6">
        <label className="label">
          <span className="label-text">Select Session (Optional)</span>
        </label>
        <select 
          className="select select-bordered w-full max-w-xs"
          value={selectedSession || ''}
          onChange={(e) => setSelectedSession(e.target.value || null)}
        >
          <option value="">No session selected (create draft notes)</option>
          {sessions.map(session => (
            <option key={session.id} value={session.id}>
              {session.date} - {session.title}
            </option>
          ))}
        </select>
      </div>

      {/* Create new note button */}
      <div className="mb-6">
        <button 
          className="btn btn-primary" 
          onClick={createNewNote}
        >
          Create New Note {selectedSession ? 'for Session' : '(Draft)'}
        </button>
      </div>

      {/* Notes list or editor */}
      {isEditing ? (
        <div className="card bg-base-200 p-4">
          <h2 className="text-xl font-bold mb-4">
            {currentNote?.id ? 'Edit Note' : 'New Note'}
          </h2>
          
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Title</span>
            </label>
            <input 
              type="text" 
              className="input input-bordered" 
              value={currentNote?.title || ''}
              onChange={(e) => setCurrentNote(prev => 
                prev ? {...prev, title: e.target.value} : null
              )}
            />
          </div>
          
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Content</span>
            </label>
            <MarkdownEditor 
              value={currentNote?.content || ''}
              onChange={(content) => setCurrentNote(prev => 
                prev ? {...prev, content} : null
              )}
            />
          </div>
          
          <div className="mb-4">
            <h3 className="text-lg font-bold mb-2">Relationships</h3>
            <p className="text-sm mb-4">Add relationships to automatically link them when creating a session log.</p>
            
            <div className="grid gap-4">
              <Collapsible title="Locations" storageKey="note-rel-locations" defaultOpen={false}>
                <RelationPicker
                  title=""
                  options={locationsOpts}
                  selected={currentNote?.linkedLocations || []}
                  onChange={(next) => setCurrentNote(prev => 
                    prev ? {...prev, linkedLocations: next} : null
                  )}
                  loading={loadingRefs}
                  onRefresh={loadRelationOptions}
                />
              </Collapsible>
              
              <Collapsible title="NPCs" storageKey="note-rel-npcs" defaultOpen={false}>
                <RelationPicker
                  title=""
                  options={npcsOpts}
                  selected={currentNote?.linkedNpcs || []}
                  onChange={(next) => setCurrentNote(prev => 
                    prev ? {...prev, linkedNpcs: next} : null
                  )}
                  loading={loadingRefs}
                  onRefresh={loadRelationOptions}
                />
              </Collapsible>
              
              <Collapsible title="Monsters" storageKey="note-rel-monsters" defaultOpen={false}>
                <RelationPicker
                  title=""
                  options={monstersOpts}
                  selected={currentNote?.linkedMonsters || []}
                  onChange={(next) => setCurrentNote(prev => 
                    prev ? {...prev, linkedMonsters: next} : null
                  )}
                  loading={loadingRefs}
                  onRefresh={loadRelationOptions}
                />
              </Collapsible>
              
              <Collapsible title="Related Sessions" storageKey="note-rel-sessions" defaultOpen={false}>
                <RelationPicker
                  title=""
                  options={sessionsOpts}
                  selected={currentNote?.linkedSessions || []}
                  onChange={(next) => setCurrentNote(prev => 
                    prev ? {...prev, linkedSessions: next} : null
                  )}
                  loading={loadingRefs}
                  onRefresh={loadRelationOptions}
                />
              </Collapsible>
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <button className="btn" onClick={cancelEditing}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={saveNote}>
              Save
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Draft Notes Section */}
          <h2 className="text-2xl font-bold mb-4">Draft Notes</h2>
          {loadingDrafts ? (
            <div>Loading draft notes...</div>
          ) : draftNotes.length === 0 ? (
            <div className="alert mb-8">
              No draft notes found. Create one to get started.
            </div>
          ) : (
            <div className="grid gap-4 mb-8">
              {draftNotes.map(note => {
                // Format the creation date if available
                let createdDate = '';
                if (note.createdAt && typeof note.createdAt.toDate === 'function') {
                  createdDate = note.createdAt.toDate().toLocaleDateString();
                }
                
                return (
                  <div key={note.id} className="card bg-base-200 border-l-4 border-yellow-500">
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="card-title text-lg">{note.title}</h2>
                          {createdDate && (
                            <p className="text-xs opacity-70">Created: {createdDate}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button 
                            className="btn btn-square btn-ghost btn-xs"
                            onClick={() => editNote(note)}
                            title="Edit note"
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn btn-square btn-ghost btn-xs"
                            onClick={() => deleteNote(note)}
                            title="Delete note"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      
                      {/* Preview of content - just first 60 chars */}
                      {note.content && (
                        <p className="text-sm mt-2 opacity-80 line-clamp-2">
                          {note.content.substring(0, 60)}{note.content.length > 60 ? '...' : ''}
                        </p>
                      )}
                      
                      <div className="card-actions justify-end mt-2">
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => createSessionFromNotes(note)}
                        >
                          Create Session Log
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Session Notes Section - Only show if a session is selected */}
          {selectedSession && (
            <>
              <h2 className="text-2xl font-bold mb-4">Session Notes</h2>
              {loading ? (
                <div>Loading session notes...</div>
              ) : notes.length === 0 ? (
                <div className="alert">
                  No notes found for this session. Create one to get started.
                </div>
              ) : (
                <div className="grid gap-4">
                  {notes.map(note => {
                    // Format the creation date if available
                    let createdDate = '';
                    if (note.createdAt && typeof note.createdAt.toDate === 'function') {
                      createdDate = note.createdAt.toDate().toLocaleDateString();
                    }
                    
                    return (
                      <div key={note.id} className="card bg-base-200">
                        <div className="card-body p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h2 className="card-title text-lg">{note.title}</h2>
                              {createdDate && (
                                <p className="text-xs opacity-70">Created: {createdDate}</p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <button 
                                className="btn btn-square btn-ghost btn-xs"
                                onClick={() => editNote(note)}
                                title="Edit note"
                              >
                                ✏️
                              </button>
                              <button 
                                className="btn btn-square btn-ghost btn-xs"
                                onClick={() => deleteNote(note)}
                                title="Delete note"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          
                          {/* Preview of content - just first 60 chars */}
                          {note.content && (
                            <p className="text-sm mt-2 opacity-80 line-clamp-2">
                              {note.content.substring(0, 60)}{note.content.length > 60 ? '...' : ''}
                            </p>
                          )}
                          
                          <div className="card-actions justify-end mt-2">
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => createSessionFromNotes(note)}
                            >
                              Create Session Log
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
