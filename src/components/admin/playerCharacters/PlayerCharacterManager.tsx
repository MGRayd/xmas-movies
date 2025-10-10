import React, { useEffect, useState } from "react";
import { db } from "@/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useToast } from "@/ui/ToastProvider";

type PlayerCharacter = {
  id: string;
  name: string;
  playerName?: string;
  createdAt?: any;
  updatedAt?: any;
};

export default function PlayerCharacterManager() {
  const [characters, setCharacters] = useState<PlayerCharacter[]>([]);
  const [newName, setNewName] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Load player characters
  useEffect(() => {
    loadPlayerCharacters();
  }, []);

  async function loadPlayerCharacters() {
    setLoading(true);
    try {
      const pcSnap = await getDocs(collection(db, "playerCharacters"));
      
      if (!pcSnap.empty) {
        const chars = pcSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as PlayerCharacter));
        
        // Sort characters alphabetically by name
        const sortedChars = chars.sort((a, b) => 
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        );
        
        setCharacters(sortedChars);
      } else {
        setCharacters([]);
      }
    } catch (error) {
      console.error("Error loading player characters:", error);
      toast.error("Failed to load player characters");
    } finally {
      setLoading(false);
    }
  }

  async function addPlayerCharacter() {
    if (!newName.trim()) {
      toast.error("Character name is required");
      return;
    }

    try {
      // Create a new document with auto-generated ID
      const newCharRef = doc(collection(db, "playerCharacters"));
      
      await setDoc(newCharRef, {
        name: newName.trim(),
        playerName: newPlayerName.trim() || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success("Player character added");
      setNewName("");
      setNewPlayerName("");
      loadPlayerCharacters();
    } catch (error) {
      console.error("Error adding player character:", error);
      toast.error("Failed to add player character");
    }
  }

  async function deletePlayerCharacter(id: string) {
    if (!confirm("Are you sure you want to delete this player character?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "playerCharacters", id));
      toast.success("Player character deleted");
      loadPlayerCharacters();
    } catch (error) {
      console.error("Error deleting player character:", error);
      toast.error("Failed to delete player character");
    }
  }

  return (
    <div className="container mx-auto max-w-3xl">
      <h1 className="text-2xl mb-4">Player Character Manager</h1>
      <p className="mb-4">
        Add player character names below. These names will be automatically bolded in session notes and other content.
      </p>

      {/* Add new character form */}
      <div className="bg-base-200 p-4 rounded-lg mb-6">
        <h2 className="text-xl mb-3">Add New Player Character</h2>
        <div className="flex flex-col gap-3">
          <div>
            <label className="label">
              <span className="label-text">Character Name</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Character name"
            />
          </div>
          <div>
            <label className="label">
              <span className="label-text">Player Name (optional)</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Player name"
            />
          </div>
          <button 
            className="btn btn-primary" 
            onClick={addPlayerCharacter}
            disabled={!newName.trim()}
          >
            Add Character
          </button>
        </div>
      </div>

      {/* Character list */}
      <div className="bg-base-200 p-4 rounded-lg">
        <h2 className="text-xl mb-3">Player Characters</h2>
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : characters.length === 0 ? (
          <div className="text-center py-4 italic">No player characters added yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Character Name</th>
                  <th>Player Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {characters.map((char) => (
                  <tr key={char.id}>
                    <td>{char.name}</td>
                    <td>{char.playerName || "-"}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-error"
                        onClick={() => deletePlayerCharacter(char.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
