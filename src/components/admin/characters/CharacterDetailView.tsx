import React, { useState, useEffect } from "react";
import EnhancedMarkdown from "@/components/EnhancedMarkdown";

type CharacterDoc = {
  id: string;
  name?: string;
  playerName?: string;
  characterClass?: string;
  level?: string;
  race?: string;
  dndbeyondUrl?: string;
  abilityScores?: {
    str?: string;
    dex?: string;
    con?: string;
    int?: string;
    wis?: string;
    cha?: string;
  };
  proficiencyBonus?: string;
  savingThrows?: {
    str?: { proficient: boolean; bonus?: string };
    dex?: { proficient: boolean; bonus?: string };
    con?: { proficient: boolean; bonus?: string };
    int?: { proficient: boolean; bonus?: string };
    wis?: { proficient: boolean; bonus?: string };
    cha?: { proficient: boolean; bonus?: string };
  };
  ac?: string;
  hp?: string;
  speed?: string;
  gold?: string;
  
  // markdown content
  notesMarkdown?: string;
  
  // image
  imageUrl?: string;
};

// Calculate ability score modifier using D&D 5e formula: (score - 10) / 2, rounded down
function calculateModifier(score: string | undefined): string {
  if (!score || isNaN(parseInt(score))) return "0";
  const modifier = Math.floor((parseInt(score) - 10) / 2);
  return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

export default function CharacterDetailView({ data }: { data: CharacterDoc }) {
  const notes = data.notesMarkdown ?? "";
  
  // State for tracking character stats and status
  const [currentHP, setCurrentHP] = useState<string>("");
  const [tempHP, setTempHP] = useState<string>("");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [hasInspiration, setHasInspiration] = useState<boolean>(false);
  const [gold, setGold] = useState<string>("");
  const [goldAdjustment, setGoldAdjustment] = useState<string>("");
  const [statusEffects, setStatusEffects] = useState<string[]>([]);
  const [newStatusEffect, setNewStatusEffect] = useState<string>("");
  
  // Load character state from local storage when component mounts
  useEffect(() => {
    if (data.id) {
      // Load HP values
      const savedHP = localStorage.getItem(`character_${data.id}_currentHP`);
      const savedTempHP = localStorage.getItem(`character_${data.id}_tempHP`);
      
      if (savedHP) {
        setCurrentHP(savedHP);
      } else if (data.hp) {
        // Initialize with max HP if no saved value exists
        setCurrentHP(data.hp);
      }
      
      if (savedTempHP) {
        setTempHP(savedTempHP);
      }
      
      // Load inspiration
      const savedInspiration = localStorage.getItem(`character_${data.id}_inspiration`);
      setHasInspiration(savedInspiration === 'true');
      
      // Load gold - use character data as default if available
      const savedGold = localStorage.getItem(`character_${data.id}_gold`);
      if (savedGold) {
        setGold(savedGold);
      } else if (data.gold) {
        setGold(data.gold);
      }
      
      // Load status effects
      const savedStatusEffects = localStorage.getItem(`character_${data.id}_statusEffects`);
      if (savedStatusEffects) {
        try {
          setStatusEffects(JSON.parse(savedStatusEffects));
        } catch (e) {
          console.error("Error parsing status effects", e);
          setStatusEffects([]);
        }
      }
    }
  }, [data.id, data.hp]);
  
  // Save current HP to local storage when it changes
  const handleHPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHP = e.target.value;
    setCurrentHP(newHP);
    if (data.id) {
      localStorage.setItem(`character_${data.id}_currentHP`, newHP);
    }
  };
  
  // Handle temp HP change
  const handleTempHPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTempHP = e.target.value;
    setTempHP(newTempHP);
    if (data.id) {
      localStorage.setItem(`character_${data.id}_tempHP`, newTempHP);
    }
  };
  
  // Adjust HP by a specific amount
  const adjustHP = (amount: number) => {
    // First use temp HP if available
    let newTempHP = tempHP ? parseInt(tempHP) : 0;
    let newCurrentHP = currentHP ? parseInt(currentHP) : 0;
    
    if (amount < 0) { // Taking damage
      // Use temp HP first
      if (newTempHP > 0) {
        if (Math.abs(amount) <= newTempHP) {
          // Temp HP can absorb all damage
          newTempHP += amount; // amount is negative, so this reduces temp HP
          amount = 0;
        } else {
          // Temp HP absorbs part of the damage
          amount += newTempHP; // This makes amount less negative
          newTempHP = 0;
        }
      }
      
      // Apply remaining damage to current HP
      if (amount < 0) {
        newCurrentHP = Math.max(0, newCurrentHP + amount);
      }
    } else { // Healing
      // Healing only affects current HP, not temp HP
      const maxHP = data.hp ? parseInt(data.hp) : 0;
      newCurrentHP = Math.min(maxHP, newCurrentHP + amount);
    }
    
    // Update state and localStorage
    setCurrentHP(newCurrentHP.toString());
    setTempHP(newTempHP.toString() || "");
    
    if (data.id) {
      localStorage.setItem(`character_${data.id}_currentHP`, newCurrentHP.toString());
      localStorage.setItem(`character_${data.id}_tempHP`, newTempHP.toString() || "");
    }
  };
  
  // Toggle inspiration
  const toggleInspiration = () => {
    const newValue = !hasInspiration;
    setHasInspiration(newValue);
    if (data.id) {
      localStorage.setItem(`character_${data.id}_inspiration`, newValue.toString());
    }
  };
  
  // Handle gold change
  const handleGoldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newGold = e.target.value;
    setGold(newGold);
    if (data.id) {
      localStorage.setItem(`character_${data.id}_gold`, newGold);
    }
  };
  
  // Adjust gold by amount
  const adjustGold = (amount: number) => {
    const currentGold = gold ? parseFloat(gold) : 0;
    const newGold = (currentGold + amount).toFixed(2);
    setGold(newGold);
    if (data.id) {
      localStorage.setItem(`character_${data.id}_gold`, newGold);
    }
  };
  
  // Add status effect
  const addStatusEffect = () => {
    if (newStatusEffect.trim() !== "" && !statusEffects.includes(newStatusEffect.trim())) {
      const updatedEffects = [...statusEffects, newStatusEffect.trim()];
      setStatusEffects(updatedEffects);
      setNewStatusEffect("");
      if (data.id) {
        localStorage.setItem(`character_${data.id}_statusEffects`, JSON.stringify(updatedEffects));
      }
    }
  };
  
  // Remove status effect
  const removeStatusEffect = (effect: string) => {
    const updatedEffects = statusEffects.filter(e => e !== effect);
    setStatusEffects(updatedEffects);
    if (data.id) {
      localStorage.setItem(`character_${data.id}_statusEffects`, JSON.stringify(updatedEffects));
    }
  };
  
  // Reset current HP to max
  const resetHP = () => {
    if (data.hp) {
      setCurrentHP(data.hp);
      setTempHP("");
      if (data.id) {
        localStorage.setItem(`character_${data.id}_currentHP`, data.hp);
        localStorage.setItem(`character_${data.id}_tempHP`, "");
      }
    }
  };
  
  return (
    <div className="space-y-8">
      
      {/* Basic Character Info - Single Line */}
      <div className="flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-2 mb-4 sm:mb-6 p-2 sm:p-3 border-b border-base-300">
        {data.playerName && (
          <div className="flex items-center">
            <span className="font-semibold mr-1">Player:</span> {data.playerName}
          </div>
        )}
        
        {data.characterClass && (
          <div className="flex items-center">
            <span className="font-semibold mr-1">Class:</span> {data.characterClass}
          </div>
        )}
        
        {data.level && (
          <div className="flex items-center">
            <span className="font-semibold mr-1">Level:</span> {data.level}
          </div>
        )}
        
        {data.race && (
          <div className="flex items-center">
            <span className="font-semibold mr-1">Race:</span> {data.race}
          </div>
        )}
        
        {data.dndbeyondUrl && (
          <div className="flex items-center">
            <span className="font-semibold mr-1">D&D Beyond:</span>
            <a 
              href={data.dndbeyondUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 underline"
            >
              Character Sheet
            </a>
          </div>
        )}
      </div>
      
      {/* Character Status Tracking Section */}
      <section className="mb-6 pt-1 px-2 sm:px-4 pb-4 border border-base-300 rounded-lg bg-base-200">
        <div className="border-b border-red-500 mb-3">
          <h2 className="text-xl font-semibold mb-1">Character Tracking</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          {/* Left column - Stats and HP */}
          <div>
            {/* Stats Row */}
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-3">
              {/* AC */}
              {data.ac && (
                <div className="bg-base-300 p-2 sm:p-3 rounded-lg text-center flex-1 min-w-[70px]">
                  <div className="text-sm font-semibold">AC</div>
                  <div className="text-xl">{data.ac}</div>
                </div>
              )}
              
              {/* Speed */}
              {data.speed && (
                <div className="bg-base-300 p-2 sm:p-3 rounded-lg text-center flex-1 min-w-[70px]">
                  <div className="text-sm font-semibold">Speed</div>
                  <div className="text-xl">{data.speed}</div>
                </div>
              )}

              {/* Proficiency Bonus */}
              {data.proficiencyBonus && (
                <div className="bg-base-300 p-2 sm:p-3 rounded-lg text-center flex-1 min-w-[70px]">
                  <div className="text-sm font-semibold">Prof Bonus</div>
                  <div className="text-xl">{data.proficiencyBonus}</div>
                </div>
              )}
              
              {/* Heroic Inspiration */}
              <div className="bg-base-300 p-2 sm:p-3 rounded-lg flex items-center justify-center flex-1 min-w-[100px]">
                <label className="flex items-center gap-1 sm:gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={hasInspiration} 
                    onChange={toggleInspiration}
                    className="checkbox checkbox-primary checkbox-sm sm:checkbox-md"
                  />
                  <span className="font-semibold text-xs sm:text-sm">Inspiration</span>
                </label>
              </div>
            </div>
            
            {/* HP Section */}
            {data.hp && (
              <>
                <div className="bg-base-300 p-2 sm:p-3 rounded-lg mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Hit Points</span>
                    <button 
                      onClick={resetHP}
                      className="btn btn-xs btn-outline"
                      title="Reset to max HP"
                    >
                      Reset
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={currentHP}
                      onChange={handleHPChange}
                      className="input input-bordered input-sm w-16 text-center"
                      aria-label="Current HP"
                    />
                    <span className="text-sm">/</span>
                    <span>{data.hp}</span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-1 mb-2">
                    <button onClick={() => adjustHP(-1)} className="btn btn-xs sm:btn-sm btn-error">-1</button>
                    <button onClick={() => adjustHP(-5)} className="btn btn-xs sm:btn-sm btn-error">-5</button>
                    <button onClick={() => adjustHP(1)} className="btn btn-xs sm:btn-sm btn-success">+1</button>
                    <button onClick={() => adjustHP(5)} className="btn btn-xs sm:btn-sm btn-success">+5</button>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <input
                      type="number"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="input input-bordered input-sm w-16 text-center"
                      placeholder="#"
                    />
                    <div className="flex gap-2 flex-grow">
                      <button 
                        onClick={() => {
                          if (customAmount) {
                            adjustHP(-parseInt(customAmount));
                            setCustomAmount("");
                          }
                        }}
                        className="btn btn-xs sm:btn-sm btn-outline btn-error flex-1"
                        disabled={!customAmount}
                      >
                        Damage
                      </button>
                      <button 
                        onClick={() => {
                          if (customAmount) {
                            adjustHP(parseInt(customAmount));
                            setCustomAmount("");
                          }
                        }}
                        className="btn btn-xs sm:btn-sm btn-outline btn-success flex-1"
                        disabled={!customAmount}
                      >
                        Heal
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Temp HP */}
                <div className="bg-base-300 p-2 sm:p-3 rounded-lg">
                  <div className="font-semibold mb-2">Temporary HP</div>
                  <input
                    type="text"
                    value={tempHP}
                    onChange={handleTempHPChange}
                    className="input input-bordered input-sm w-16 text-center"
                    aria-label="Temporary HP"
                    placeholder="0"
                  />
                </div>
              </>
            )}
          </div>
          
          {/* Right column - Gold and Status Effects */}
          <div>
            {/* Gold Section */}
            <div className="bg-base-300 p-2 sm:p-3 rounded-lg mb-3">
              <h3 className="font-semibold mb-2">Gold</h3>
              <div className="flex items-center gap-2 mb-2">
                <input 
                  type="text"
                  value={gold}
                  onChange={handleGoldChange}
                  className="input input-bordered input-sm w-24 text-center"
                  placeholder="0"
                />
                <span>gp</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <input 
                  type="number"
                  value={goldAdjustment}
                  onChange={(e) => setGoldAdjustment(e.target.value)}
                  className="input input-bordered input-sm w-20 text-center"
                  placeholder="#"
                />
                <div className="flex gap-2 flex-grow">
                  <button 
                    onClick={() => {
                      if (goldAdjustment) {
                        adjustGold(parseFloat(goldAdjustment));
                        setGoldAdjustment("");
                      }
                    }}
                    className="btn btn-xs sm:btn-sm btn-outline btn-success flex-1"
                    disabled={!goldAdjustment}
                  >
                    Add
                  </button>
                  <button 
                    onClick={() => {
                      if (goldAdjustment) {
                        adjustGold(-parseFloat(goldAdjustment));
                        setGoldAdjustment("");
                      }
                    }}
                    className="btn btn-xs sm:btn-sm btn-outline btn-error flex-1"
                    disabled={!goldAdjustment}
                  >
                    Spend
                  </button>
                </div>
              </div>
            </div>
            
            {/* Status Effects */}
            <div className="bg-base-300 p-2 sm:p-3 rounded-lg">
              <h3 className="font-semibold mb-2">Status Effects</h3>
              <div className="flex flex-wrap gap-1 sm:gap-2 mb-2">
                {statusEffects.length > 0 ? (
                  statusEffects.map((effect, index) => (
                    <div 
                      key={index} 
                      className="badge badge-secondary gap-1"
                    >
                      {effect}
                      <button 
                        onClick={() => removeStatusEffect(effect)}
                        className="btn btn-ghost btn-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                ) : (
                  <span className="text-sm italic">No active effects</span>
                )}
              </div>
              <div className="flex gap-1 sm:gap-2">
                <input 
                  type="text" 
                  value={newStatusEffect}
                  onChange={(e) => setNewStatusEffect(e.target.value)}
                  className="input input-bordered input-sm w-full"
                  placeholder="Poisoned, Stunned, etc."
                />
                <button 
                  onClick={addStatusEffect}
                  className="btn btn-xs sm:btn-sm btn-outline"
                  disabled={!newStatusEffect.trim()}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Ability Scores */}
      {data.abilityScores && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Ability Scores</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center">
            {["str", "dex", "con", "int", "wis", "cha"].map((ability) => {
              const score = data.abilityScores?.[ability as keyof typeof data.abilityScores];
              const modifier = calculateModifier(score);
              
              return (
                <div key={ability} className="bg-base-200 p-2 rounded-lg">
                  <div className="uppercase font-bold text-sm">{ability}</div>
                  <div className="text-md">{score || "-"}</div>
                  <div className="text-lg font-bold">{modifier}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}
      
      {/* Saving Throws */}
      {data.savingThrows && (
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Saving Throws</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center">
            {["str", "dex", "con", "int", "wis", "cha"].map((ability) => {
              const savingThrow = data.savingThrows?.[ability as keyof typeof data.savingThrows];
              const isProficient = savingThrow?.proficient;
              const additionalBonus = savingThrow?.bonus || "";
              const score = data.abilityScores?.[ability as keyof typeof data.abilityScores];
              const baseModifier = calculateModifier(score);
              
              // Calculate saving throw value (base modifier + proficiency bonus if proficient + additional bonus)
              let saveValue = baseModifier;
              let totalBonus = 0;
              let bonusDetails = [];
              
              // Add proficiency bonus if proficient
              if (isProficient && data.proficiencyBonus) {
                const profBonus = data.proficiencyBonus;
                if (profBonus.startsWith('+')) {
                  const profValue = parseInt(profBonus.substring(1));
                  if (!isNaN(profValue)) {
                    totalBonus += profValue;
                    bonusDetails.push(`Prof: ${profBonus}`);
                  }
                }
              }
              
              // Add additional bonus if any
              if (additionalBonus) {
                let bonusValue;
                if (additionalBonus.startsWith('+')) {
                  bonusValue = parseInt(additionalBonus.substring(1));
                } else if (additionalBonus.startsWith('-')) {
                  bonusValue = parseInt(additionalBonus);
                } else {
                  // If no sign, assume positive
                  bonusValue = parseInt(additionalBonus);
                }
                
                if (!isNaN(bonusValue)) {
                  totalBonus += bonusValue;
                  bonusDetails.push(`Bonus: ${bonusValue >= 0 ? '+' + bonusValue : bonusValue}`);
                }
              }
              
              // Calculate final save value
              if (totalBonus !== 0) {
                const baseValue = parseInt(baseModifier);
                if (!isNaN(baseValue)) {
                  const total = baseValue + totalBonus;
                  saveValue = total >= 0 ? `+${total}` : `${total}`;
                }
              }
              
              // Create a tooltip showing the breakdown of the saving throw
              const tooltipParts = [];
              if (baseModifier) tooltipParts.push(`Base: ${baseModifier}`);
              if (isProficient && data.proficiencyBonus) tooltipParts.push(`Prof: ${data.proficiencyBonus}`);
              if (additionalBonus) tooltipParts.push(`Bonus: ${additionalBonus}`);
              const tooltipText = tooltipParts.join(' + ');
              
              return (
                <div 
                  key={ability} 
                  className={`bg-base-200 p-2 rounded-lg ${isProficient ? 'border-2 border-primary' : ''}`}
                  title={tooltipText}
                >
                  <div className="uppercase font-bold text-sm">{ability}</div>
                  <div className="text-lg font-bold">{saveValue}</div>
                  <div className="flex flex-wrap justify-center gap-1 text-xs">
                    {isProficient && data.proficiencyBonus && (
                      <span className="badge badge-primary badge-sm">
                        Prof {data.proficiencyBonus}
                      </span>
                    )}
                    {additionalBonus && (
                      <span className="badge badge-secondary badge-sm">
                        {additionalBonus.startsWith('+') ? additionalBonus : `+${additionalBonus}`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
      
      {/* Notes */}
      {notes && notes.trim() !== "" && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Notes</h2>
          <EnhancedMarkdown>{notes}</EnhancedMarkdown>
        </section>
      )}
    </div>
  );
}
