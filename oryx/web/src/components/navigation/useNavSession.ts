"use client";

import { useEffect, useState } from "react";

type NavSessionPayload = {
  signedIn: boolean;
  isFounder: boolean;
  isPlatformAdmin: boolean;
  dashboardHref: string | null;
  dashboardLabel: string | null;
  signOutHref: string;
};

const DEFAULT_SESSION: NavSessionPayload = {
  signedIn: false,
  isFounder: false,
  isPlatformAdmin: false,
  dashboardHref: null,
  dashboardLabel: null,
  signOutHref: "/account/logout",
};

export function useNavSession() {
  const [session, setSession] = useState<NavSessionPayload>(DEFAULT_SESSION);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        const payload = (await response.json().catch(() => ({}))) as Partial<NavSessionPayload>;
        if (!active || !response.ok) {
          return;
        }

        setSession({
          signedIn: payload.signedIn === true,
          isFounder: payload.isFounder === true,
          isPlatformAdmin: payload.isPlatformAdmin === true,
          dashboardHref: payload.dashboardHref || null,
          dashboardLabel: payload.dashboardLabel || null,
          signOutHref: payload.signOutHref || "/account/logout",
        });
      } finally {
        if (active) {
          setLoaded(true);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  return {
    loaded,
    session,
  };
}
