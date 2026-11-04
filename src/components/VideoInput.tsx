import { type SubmitEvent, useState } from "react";
import { parseVideoInput, watchUrl } from "../lib/parseVideoInput";
import type { ParsedVideo } from "../types/loop";

interface Props {
  videoId: string;
  onLoad: (video: ParsedVideo) => void;
}

// App keys this by videoId, so the box restarts from the loaded video's link whenever it changes
export default function VideoInput({ videoId, onLoad }: Props) {
  const [text, setText] = useState(() => (videoId ? watchUrl(videoId) : ""));
  const [invalid, setInvalid] = useState(false);

  function submit(e: SubmitEvent) {
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
