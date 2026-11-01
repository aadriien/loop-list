import { API_BASE } from "../constants/sync";
import type { SavedLoop } from "../types/library";

export class ApiError extends Error {
  constructor(public status: number) {
    super(`HTTP ${status}`);
  }
}

// PocketBase can't store null numbers, so a missing end is sent as 0
type RemoteLoop = Omit<SavedLoop, "end"> & { end: number };

async function request(path: string, token: string | null, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: token }),
    },
  });
  if (!res.ok) throw new ApiError(res.status);
  return res.json();
}

const post = (body: object) => ({ method: "POST", body: JSON.stringify(body) });

export async function signIn(email: string, password: string) {
  const data = await request(
    "/users/auth-with-password",
    null,
    post({ identity: email, password }),
  );
  return data.token as string;
}

export async function refreshToken(token: string) {
  const data = await request("/users/auth-refresh", token, post({}));
  return data.token as string;
}

// One page of 500 is plenty for a personal library
export async function fetchLoops(token: string): Promise<SavedLoop[]> {
  const data = await request("/loops/records?perPage=500", token);
  return data.items.map((r: RemoteLoop) => ({
    id: r.id,
    videoId: r.videoId,
    title: r.title,
    start: r.start,
    end: r.end || null,
    rate: r.rate,
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
    ? request(`/loops/records/${id}`, token, {
        method: "PATCH",
        body: JSON.stringify(body),
      })
    : request("/loops/records", token, post({ id, ...body }));
}
