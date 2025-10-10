import React, { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";

type PlayerCharacter = {
  id: string;
  name: string;
  playerName?: string;
};

interface PlayerCharacterReferenceProps {
  onInsert?: (characterName: string) => void;
}

export default function PlayerCharacterReference({ onInsert }: PlayerCharacterReferenceProps) {
  const [characters, setCharacters] = useState<PlayerCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
    } finally {
      setLoading(false);
    }
  }

  const handleInsert = (character: PlayerCharacter) => {
    if (onInsert) {
      onInsert(character.name);
    }
  };

  // Filter characters based on search term
  const filteredCharacters = searchTerm
    ? characters.filter(char => 
        char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (char.playerName && char.playerName.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : characters;

  return (
    <div className="player-character-reference border border-base-300 rounded-lg shadow-sm">
      <div 
        className="bg-base-200 p-2 rounded-t-lg flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-sm font-bold flex items-center gap-1">
          <span>{isExpanded ? "▼" : "▶"}</span>
          <span>Quick Reference: Player Characters</span>
          <span className="badge badge-sm">{characters.length}</span>
        </h3>
        <div className="flex items-center gap-1">
          <button 
            className="btn btn-xs btn-ghost tooltip tooltip-left" 
            data-tip="Refresh list"
            onClick={(e) => {
              e.stopPropagation();
              loadPlayerCharacters();
            }}
          >
            🔄
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="bg-base-100 rounded-b-lg p-2 max-h-60 overflow-y-auto">
          {/* Search input */}
          <div className="mb-2">
            <input
              type="text"
              className="input input-bordered input-sm w-full"
              placeholder="Search characters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {loading ? (
            <div className="text-center py-2 text-sm">Loading...</div>
          ) : characters.length === 0 ? (
            <div className="text-center py-2 text-sm italic">No player characters found</div>
          ) : filteredCharacters.length === 0 ? (
            <div className="text-center py-2 text-sm italic">No matches found</div>
          ) : (
            <div className="grid gap-1">
              {filteredCharacters.map((char) => (
                <div 
                  key={char.id} 
                  className="flex justify-between items-center p-2 hover:bg-base-200 rounded cursor-pointer transition-colors"
                  onClick={() => handleInsert(char)}
                  title={`Click to insert "${char.name}" at cursor position`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{char.name}</span>
                    {char.playerName && (
                      <span className="text-xs opacity-70">Player: {char.playerName}</span>
                    )}
                  </div>
                  <div className="tooltip tooltip-left" data-tip="Click to insert">
                    <button className="btn btn-xs btn-ghost">Insert</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="text-xs text-center mt-2 opacity-70">
            Click on a character name to insert it at cursor position
          </div>
        </div>
      )}
    </div>
  );
}
