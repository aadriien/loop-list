import { type SubmitEvent, useState } from "react";
import type { SyncStatus } from "../types/sync";

interface Props {
  signedIn: boolean;
  status: SyncStatus;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignOut: () => void;
}

const LABELS: Record<SyncStatus, string> = {
  idle: "Signed in",
  syncing: "Syncing…",
  synced: "Synced",
  error: "Sync failed, will retry on the next change",
};

export default function SyncPanel({
  signedIn,
  status,
  onSignIn,
  onSignOut,
}: Props) {
  const [failed, setFailed] = useState(false);

  async function submit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await onSignIn(String(form.get("email")), String(form.get("password")));
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }

  return (
    <aside className="sync">
      <h2>Sync</h2>
      {signedIn ? (
        <div className="row">
          <span className="hint">{LABELS[status]}</span>
          <button type="button" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      ) : (
        <form onSubmit={submit}>
          <input
            name="email"
            type="email"
            autoComplete="username"
            placeholder="Email"
            required
          />
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            required
          />
          <button type="submit">Sign in</button>
          {failed && <p className="error">Sign-in failed</p>}
        </form>
      )}
    </aside>
  );
}
