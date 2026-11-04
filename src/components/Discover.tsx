import { type SubmitEvent, useState } from "react";
import { DISCOVER_OPEN_KEY } from "../constants/search";
import { loadFlag, saveFlag } from "../lib/flagStorage";
import { ApiError, searchVideos } from "../lib/pocketbase";
import type { SearchResult } from "../types/search";

interface Props {
  token: string;
  onOpen: (videoId: string) => void;
}

const thumbnail = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

export default function Discover({ token, onOpen }: Props) {
  const [open, setOpen] = useState(() => loadFlag(DISCOVER_OPEN_KEY));
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [nextPage, setNextPage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const toggle = () => {
    saveFlag(DISCOVER_OPEN_KEY, !open);
    setOpen(!open);
  };

  async function search(q: string, pageToken = "") {
    setLoading(true);
    setError("");
    try {
      const page = await searchVideos(token, q, pageToken);
      setResults((prev) => (pageToken ? [...prev, ...page.items] : page.items));
      setNextPage(page.nextPageToken);
      setQuery(q);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't reach the server");
    } finally {
      setLoading(false);
    }
  }

  function submit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = String(new FormData(e.currentTarget).get("q")).trim();
    if (q) search(q);
  }

  return (
    <aside className="discover">
      <button type="button" aria-expanded={open} onClick={toggle}>
        Discover videos {open ? "▴" : "▾"}
      </button>
      {open && (
        <>
          <form className="row" onSubmit={submit}>
            <input name="q" placeholder="Search YouTube" aria-label="Search" />
            <button type="submit" disabled={loading}>
              Search
            </button>
          </form>
          {error && <p className="error">{error}</p>}
          {results.length > 0 && (
            <ul className="results">
              {results.map((result) => (
                <li key={result.videoId}>
                  <button
                    type="button"
                    className={
                      result.videoId === selected ? "result active" : "result"
                    }
                    onClick={() => {
                      setSelected(result.videoId);
                      onOpen(result.videoId);
                    }}
                  >
                    <img
                      src={thumbnail(result.videoId)}
                      alt=""
                      loading="lazy"
                    />
                    <span className="info">
                      <span className="title">{result.title}</span>
                      <span className="meta">{result.channel}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {nextPage && (
            <button
              type="button"
              disabled={loading}
              onClick={() => search(query, nextPage)}
            >
              {loading ? "Loading…" : "Load more"}
            </button>
          )}
        </>
      )}
    </aside>
  );
}
