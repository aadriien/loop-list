import { type SubmitEvent, useState } from "react";
import { DISCOVER_OPEN_KEY } from "../constants/search";
import { ApiError, searchVideos } from "../lib/pocketbase";
import { addRecent, loadRecent, saveRecent } from "../lib/recentSearches";
import { cacheKey, cachePage, getCachedPage } from "../lib/searchCache";
import type { SearchResult } from "../types/search";
import CollapsiblePanel from "./CollapsiblePanel";

interface Props {
  token: string;
  onOpen: (videoId: string) => void;
}

const thumbnail = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;

export default function Discover({ token, onOpen }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [nextPage, setNextPage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [recent, setRecent] = useState(loadRecent);

  async function search(q: string, pageToken = "") {
    setLoading(true);
    setError("");
    try {
      const key = cacheKey(q, pageToken);
      const cached = getCachedPage(key);
      const page = cached ?? (await searchVideos(token, q, pageToken));
      if (!cached) cachePage(key, page);
      setResults((prev) => (pageToken ? [...prev, ...page.items] : page.items));
      setNextPage(page.nextPageToken);
      setQuery(q);
      if (!pageToken) {
        const next = addRecent(recent, q);
        setRecent(next);
        saveRecent(next);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't reach the server");
    } finally {
      setLoading(false);
    }
  }

  function submit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = text.trim();
    if (q) search(q);
  }

  return (
    <CollapsiblePanel
      title="Discover videos"
      storageKey={DISCOVER_OPEN_KEY}
      className="discover"
    >
      <form className="row" onSubmit={submit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search YouTube"
          aria-label="Search"
        />
        <button type="submit" disabled={loading}>
          Search
        </button>
      </form>
      {recent.length > 0 && (
        <ul className="chips" aria-label="Recent searches">
          {recent.map((q) => (
            <li key={q}>
              <button
                type="button"
                className="chip"
                onClick={() => {
                  setText(q);
                  search(q);
                }}
              >
                {q}
              </button>
            </li>
          ))}
        </ul>
      )}
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
                <img src={thumbnail(result.videoId)} alt="" loading="lazy" />
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
    </CollapsiblePanel>
  );
}
