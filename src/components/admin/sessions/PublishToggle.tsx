export default function PublishToggle({
    published,
    onChange,
  }: {
    published: boolean;
    onChange: (v: boolean) => void;
  }) {
    return (
      <label className="label cursor-pointer w-fit gap-3">
        <span className="label-text">Published</span>
        <input
          type="checkbox"
          className="toggle"
          checked={published}
          onChange={(e) => onChange(e.target.checked)}
        />
      </label>
    );
  }
  