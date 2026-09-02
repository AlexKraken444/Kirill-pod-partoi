"use client";

import { useEffect } from "react";

export default function MyProfileRedirect() {
  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" }).then((response) => response.json()).then((data) => {
      window.location.replace(data.user ? `/profile/${encodeURIComponent(data.user.username)}` : "/register?next=%2Fprofile");
    }).catch(() => window.location.replace("/register?next=%2Fprofile"));
  }, []);
  return <main className="profilePage"><div className="profileLoading">Открываем профиль…</div></main>;
}
