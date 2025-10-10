import { ChangeEvent } from "react";

type Props = {
  col: string;
  name: string;
  slug: string;
  playerName: string;
  characterClass: string;
  level: string;
  race: string;
  dndbeyondUrl: string;
  onChange: (patch: Record<string, string>) => void;
};

export default function BasicFields({
  col,
  name,
  slug,
  playerName,
  characterClass,
  level,
  race,
  dndbeyondUrl,
  onChange,
}: Props) {
  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    onChange({ [name]: value });
  }

  return (
    <div className="space-y-4">
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text">Character Name</span>
        </label>
        <input
          type="text"
          name="name"
          value={name}
          onChange={handleChange}
          className="input input-bordered w-full"
          placeholder="Character name"
        />
      </div>

      <div className="form-control w-full">
        <label className="label">
          <span className="label-text">Slug (for URLs)</span>
        </label>
        <input
          type="text"
          name="slug"
          value={slug}
          onChange={handleChange}
          className="input input-bordered w-full"
          placeholder="character-name"
        />
        <label className="label">
          <span className="label-text-alt">
            Leave blank to auto-generate from name
          </span>
        </label>
      </div>

      <div className="form-control w-full">
        <label className="label">
          <span className="label-text">Player Name</span>
        </label>
        <input
          type="text"
          name="playerName"
          value={playerName}
          onChange={handleChange}
          className="input input-bordered w-full"
          placeholder="Player name"
        />
      </div>

      <div className="form-control w-full">
        <label className="label">
          <span className="label-text">D&D Beyond URL</span>
        </label>
        <input
          type="text"
          name="dndbeyondUrl"
          value={dndbeyondUrl}
          onChange={handleChange}
          className="input input-bordered w-full"
          placeholder="https://www.dndbeyond.com/characters/123456789"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Class</span>
          </label>
          <input
            type="text"
            name="characterClass"
            value={characterClass}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Fighter, Wizard, etc."
          />
        </div>

        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Level</span>
          </label>
          <input
            type="text"
            name="level"
            value={level}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="1"
          />
        </div>

        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Race</span>
          </label>
          <input
            type="text"
            name="race"
            value={race}
            onChange={handleChange}
            className="input input-bordered w-full"
            placeholder="Human, Elf, etc."
          />
        </div>
      </div>
    </div>
  );
}
