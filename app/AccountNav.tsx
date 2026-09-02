"use client";

import { useEffect, useState } from "react";

type User = { name: string; username: string; avatar: string | null };

export default function AccountNav() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => { fetch("/api/auth/session", { cache: "no-store" }).then((r) => r.json()).then((data) => setUser(data.user || null)).catch(() => undefined); }, []);

  if (!user) return <a className="accountLink" href="/register">Регистрация</a>;
  return (
    <div className="accountMenu">
      <a className="avatar" href={`/profile/${encodeURIComponent(user.username)}`} title={`Профиль ${user.name}`}>{user.avatar ? <img src={user.avatar} alt="" /> : user.name.slice(0, 1).toLocaleUpperCase("ru-RU")}</a>
      <button className="logoutButton" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.reload(); }}>Выйти</button>
    </div>
  );
}
