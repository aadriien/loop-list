import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_STORAGE_KEY } from "../src/constants/sync";
import { loadSession, saveSession } from "../src/lib/authStorage";

describe("authStorage", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("round-trips a session", () => {
    const session = { token: "abc.def.ghi", canSearch: true, isOwner: true };
    saveSession(session);
    expect(loadSession()).toEqual(session);
  });

  it("is signed out when nothing is stored, and after clearing", () => {
    expect(loadSession()).toBeNull();
    saveSession({ token: "abc", canSearch: false, isOwner: false });
    saveSession(null);
    expect(loadSession()).toBeNull();
  });

  it("upgrades a bare token saved before search existed", () => {
    store.set(AUTH_STORAGE_KEY, "eyJhbGciOi.payload.signature");
    expect(loadSession()).toEqual({
      token: "eyJhbGciOi.payload.signature",
      canSearch: false,
      isOwner: false,
    });
  });

  it.each(["{not json", "{}", '{"canSearch":true}'])(
    "ignores corrupt data %j",
    (raw) => {
      store.set(AUTH_STORAGE_KEY, raw);
      expect(loadSession()).toBeNull();
    },
  );
});
