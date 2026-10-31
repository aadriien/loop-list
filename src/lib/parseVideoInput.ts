import type { ParsedVideo } from "../types/loop";
import { parseTime } from "./time";

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const ID_PATH_PREFIXES = ["shorts", "embed", "live"];

export function parseVideoInput(text: string): ParsedVideo | null {
  const input = text.trim();
  if (VIDEO_ID.test(input)) return { id: input };

  let url: URL;
  try {
    url = new URL(input.includes("://") ? input : `https://${input}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");
  const [first, second] = url.pathname.split("/").filter(Boolean);
  let id: string | null | undefined;
  if (host === "youtu.be") {
    id = first;
  } else if (host === "youtube.com" || host.endsWith(".youtube.com")) {
    id =
      url.searchParams.get("v") ??
      (ID_PATH_PREFIXES.includes(first) ? second : null);
  }
  if (!id || !VIDEO_ID.test(id)) return null;

  const t = url.searchParams.get("t") ?? url.searchParams.get("start");
  const start = t ? parseTime(t) : null;
  return start === null ? { id } : { id, start };
}
