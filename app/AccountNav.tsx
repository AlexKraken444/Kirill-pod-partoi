"use client";

import { useEffect, useState } from "react";

type User = { name: string; username: string };

export default function AccountNav() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => { fetch("/api/auth/session", { cache: "no-store" }).then((r) => r.json()).then((data) => setUser(data.user || null)).catch(() => undefined); }, []);

  if (!user) return <a className="accountLink" href="/register">Регистрация</a>;
  return (
    <div className="accountMenu">
      <span className="avatar" title={user.name}>{user.name.slice(0, 1).toLocaleUpperCase("ru-RU")}</span>
      <button className="logoutButton" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.reload(); }}>Выйти</button>
    </div>
  );
}
