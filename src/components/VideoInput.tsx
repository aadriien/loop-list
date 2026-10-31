import { type FormEvent, useState } from "react";
import { parseVideoInput } from "../lib/parseVideoInput";
import type { ParsedVideo } from "../types/loop";

export default function VideoInput({
  onLoad,
}: {
  onLoad: (video: ParsedVideo) => void;
}) {
  const [text, setText] = useState("");
  const [invalid, setInvalid] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    const video = parseVideoInput(text);
    setInvalid(!video);
    if (video) onLoad(video);
  }

  return (
    <form className="row" onSubmit={submit}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="YouTube URL or video ID"
        aria-invalid={invalid}
      />
      <button type="submit">Load</button>
      {invalid && <p className="error">Not a valid YouTube URL or video ID</p>}
    </form>
  );
}
