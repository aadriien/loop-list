import { API_BASE } from "../constants/sync";
import type { Session } from "../types/auth";
import type { SavedLoop } from "../types/library";
import type { SearchPage } from "../types/search";

export class ApiError extends Error {
  constructor(
    public status: number,
    message = `HTTP ${status}`,
  ) {
    super(message);
  }
}

// PocketBase can't store null numbers, so a missing end is sent as 0; loops saved before
// categories existed come back with categories null
type RemoteLoop = Omit<SavedLoop, "end" | "categories"> & {
  end: number;
  categories: string[] | null;
};

async function request(path: string, token: string | null, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: token }),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.message);
  }
  return res.json();
}

const post = (body: object) => ({ method: "POST", body: JSON.stringify(body) });

const toSession = (data: {
  token: string;
  record: { canSearch?: boolean; isOwner?: boolean };
}): Session => ({
  token: data.token,
  canSearch: Boolean(data.record.canSearch),
  isOwner: Boolean(data.record.isOwner),
});

export async function signIn(email: string, password: string) {
  const data = await request(
    "/collections/users/auth-with-password",
    null,
    post({ identity: email, password }),
  );
  return toSession(data);
}

export async function refreshSession(token: string) {
  return toSession(
    await request("/collections/users/auth-refresh", token, post({})),
  );
}

// One page of 500 is plenty for a personal library
export async function fetchLoops(token: string): Promise<SavedLoop[]> {
  const data = await request("/collections/loops/records?perPage=500", token);
  return data.items.map((r: RemoteLoop) => ({
    id: r.id,
    videoId: r.videoId,
    title: r.title,
    start: r.start,
    end: r.end || null,
    rate: r.rate,
    categories: r.categories ?? [],
    updatedAt: r.updatedAt,
    deleted: r.deleted,
  }));
}

export function pushLoop(token: string, loop: SavedLoop, exists: boolean) {
  const { id, ...fields } = loop;
  const body = {
    ...fields,
    end: loop.end ?? 0,
    deleted: loop.deleted ?? false,
  };
  return exists
    ? request(`/collections/loops/records/${id}`, token, {
        method: "PATCH",
        body: JSON.stringify(body),
      })
    : request("/collections/loops/records", token, post({ id, ...body }));
}

export function searchVideos(
  token: string,
  q: string,
  pageToken = "",
): Promise<SearchPage> {
  const params = new URLSearchParams({ q });
  if (pageToken) params.set("pageToken", pageToken);
  return request(`/yt/search?${params}`, token);
}
