import { type SubmitEvent, useState } from "react";
import {
  CATEGORIES_PER_LOOP_MAX,
  CATEGORY_MAX_LENGTH,
} from "../constants/categories";
import { hasCategory, withCategory, withoutCategory } from "../lib/categories";

interface Props {
  selected: string[];
  known: string[];
  onChange: (next: string[]) => void;
}

// A loop's categories as removable chips, plus a field to add one: typing suggests existing
// categories, and a name that doesn't exist yet creates it
export default function CategoryBar({ selected, known, onChange }: Props) {
  const [text, setText] = useState("");
  const full = selected.length >= CATEGORIES_PER_LOOP_MAX;

  function submit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    onChange(withCategory(selected, text, known));
    setText("");
  }

  return (
    <div className="category-bar">
      <strong>Categories</strong>
      <form onSubmit={submit}>
        <input
          list="category-suggestions"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={CATEGORY_MAX_LENGTH}
          placeholder={full ? "Limit reached" : "Add a category"}
          aria-label="Add a category"
          disabled={full}
        />
        <datalist id="category-suggestions">
          {known
            .filter((name) => !hasCategory(selected, name))
            .map((name) => (
              <option key={name} value={name} />
            ))}
        </datalist>
        <button type="submit" disabled={full || !text.trim()}>
          Add
        </button>
      </form>
      <ul className="chips" aria-label="Categories of this loop">
        {selected.length === 0 && <li className="hint">No categories yet</li>}
        {selected.map((name) => (
          <li key={name}>
            <button
              type="button"
              className="chip"
              aria-label={`Remove ${name}`}
              onClick={() => onChange(withoutCategory(selected, name))}
            >
              {name} ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
