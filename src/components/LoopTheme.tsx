import { THEMES_A_Z } from "../constants/themes";
import { isTheme } from "../lib/themes";
import type { ThemeId } from "../types/theme";

interface Props {
  linked: ThemeId | undefined;
  current: ThemeId;
  onChange: (theme: ThemeId | undefined) => void;
}

// Links a theme to the loop; applied whenever the saved loop is opened
export default function LoopTheme({ linked, current, onChange }: Props) {
  // Array.sort is stable, so the rest stay alphabetical
  const sorted = [...THEMES_A_Z].sort(
    (a, b) => Number(b.id === current) - Number(a.id === current),
  );

  return (
    <div className="category-bar">
      <strong>Theme</strong>
      <select
        aria-label="Theme for this loop"
        value={linked ?? ""}
        onChange={(e) =>
          onChange(isTheme(e.target.value) ? e.target.value : undefined)
        }
      >
        <option value="">None</option>
        {sorted.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
            {t.id === current && " (current)"}
          </option>
        ))}
      </select>
    </div>
  );
}
