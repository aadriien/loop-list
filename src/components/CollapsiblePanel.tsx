import { type ReactNode, useState } from "react";
import { loadFlag, saveFlag } from "../lib/flagStorage";

interface Props {
  title: string;
  storageKey: string;
  className: string;
  children: ReactNode;
}

// A side panel that opens and closes from its title; the choice is remembered per storageKey
export default function CollapsiblePanel({
  title,
  storageKey,
  className,
  children,
}: Props) {
  const [open, setOpen] = useState(() => loadFlag(storageKey));

  const toggle = () => {
    saveFlag(storageKey, !open);
    setOpen(!open);
  };

  return (
    <aside className={className}>
      <button type="button" aria-expanded={open} onClick={toggle}>
        {title} {open ? "▴" : "▾"}
      </button>
      {open && children}
    </aside>
  );
}
