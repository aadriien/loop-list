import { THEMES } from "../constants/themes";
import type { ThemeId } from "../types/theme";

interface Props {
  theme: ThemeId;
  onChange: (theme: ThemeId) => void;
}

export default function ThemePicker({ theme, onChange }: Props) {
  return (
    <select
      aria-label="Theme"
      value={theme}
      onChange={(e) => onChange(e.target.value as ThemeId)}
    >
      {THEMES.map((t) => (
        <option key={t.id} value={t.id}>
          {t.label}
        </option>
      ))}
    </select>
  );
}
