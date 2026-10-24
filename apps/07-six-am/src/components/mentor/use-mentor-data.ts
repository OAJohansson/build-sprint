"use client";

// What the Analyse view and the Mentor share: the access code, whether the routes are locked,
// the taste profile (for Copy for Claude and the setup offer) and the genre groups (accepted
// names join My genre suggestions, L55).
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, mentorApi, useAccessCode, type Group, type Profile, type StoreKind } from "@/lib/mentor/client";

export type MentorData = {
  code: string;
  /** The stored access code has been read; calls wait for it (F12). */
  ready: boolean;
  /** Which store the server uses (null until known). */
  storeKind: StoreKind | null;
  setCode: (c: string) => void;
  api: ReturnType<typeof mentorApi>;
  /** null = not loaded yet (or offline). */
  profile: Profile | null;
  setProfile: (p: Profile) => void;
  groups: Group[];
  setGroups: (fn: (g: Group[]) => Group[]) => void;
  acceptedNames: string[];
  locked: boolean;
  /** "That code didn't work." after a wrong code. */
  lockError: string | null;
  /** Any call answered 401: show the unlock prompt. */
  onError: (e: unknown) => void;
  reload: () => void;
};

export function useMentorData(): MentorData {
  const [code, setCodeRaw, ready] = useAccessCode();
  const api = useMemo(() => mentorApi(code), [code]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [groups, setGroupsRaw] = useState<Group[]>([]);
  const [locked, setLocked] = useState(false);
  const [storeKind, setStoreKind] = useState<StoreKind | null>(null);
  const [tried, setTried] = useState(false);
  const [n, setN] = useState(0);

  const onError = useCallback((e: unknown) => {
    if (e instanceof ApiError && e.status === 401) setLocked(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    let live = true;
    Promise.all([api.profile(), api.groups()]).then(
      ([p, g]) => { if (live) { setProfile(p.profile); setStoreKind(p.store); setGroupsRaw(g); setLocked(false); } },
      (e) => { if (live) onError(e); },
    );
    return () => { live = false; };
  }, [api, onError, n, ready]);

  const setGroups = useCallback((fn: (g: Group[]) => Group[]) => setGroupsRaw(fn), []);
  const reload = useCallback(() => setN((x) => x + 1), []);
  const acceptedNames = useMemo(() => groups.filter((g) => g.status === "accepted").map((g) => g.name), [groups]);
  return {
    code,
    ready,
    storeKind,
    setCode: (c) => { setTried(true); setCodeRaw(c); },
    api, profile, setProfile, groups, setGroups, acceptedNames, locked,
    lockError: locked && tried ? "That code didn't work." : null,
    onError,
    reload,
  };
}
