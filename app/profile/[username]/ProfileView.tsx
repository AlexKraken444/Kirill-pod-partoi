"use client";

import { ChangeEvent, useEffect, useState } from "react";

type Profile = { name: string; username: string; bio: string; avatar: string | null; createdAt: string; isOwn: boolean; verified: boolean; canManageVerification: boolean };

function resizeAvatar(file: File) {
  return new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("Выберите изображение"));
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const size = Math.min(image.naturalWidth, image.naturalHeight);
      const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 512;
      const context = canvas.getContext("2d");
      if (!context) return reject(new Error("Не удалось обработать изображение"));
      context.drawImage(image, (image.naturalWidth - size) / 2, (image.naturalHeight - size) / 2, size, size, 0, 0, 512, 512);
      URL.revokeObjectURL(url); resolve(canvas.toDataURL("image/webp", .82));
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Не удалось открыть изображение")); };
    image.src = url;
  });
}

export default function ProfileView({ username }: { username: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState("Загрузка профиля…");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/profile/${encodeURIComponent(username)}`, { cache: "no-store" }).then(async (response) => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setProfile(data.profile); setBio(data.profile.bio); setAvatar(data.profile.avatar); setStatus("");
    }).catch((error) => setStatus(error.message || "Профиль не найден"));
  }, [username]);

  const chooseAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    try { setStatus("Обрабатываем изображение…"); setAvatar(await resizeAvatar(file)); setStatus(""); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Не удалось обработать изображение"); }
  };
  const save = async () => {
    setSaving(true); setStatus("");
    const response = await fetch(`/api/profile/${encodeURIComponent(username)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bio, avatar }) });
    const data = await response.json().catch(() => ({})); setSaving(false);
    if (!response.ok) return setStatus(data.error || "Не удалось сохранить профиль");
    setProfile((current) => current ? { ...current, bio, avatar } : current); setEditing(false); setStatus("Профиль сохранён");
  };
  const toggleVerification = async () => {
    if (!profile) return;
    setSaving(true); setStatus("");
    const response = await fetch(`/api/profile/${encodeURIComponent(username)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ verified: !profile.verified }) });
    const data = await response.json().catch(() => ({})); setSaving(false);
    if (!response.ok) return setStatus(data.error || "Не удалось изменить галочку");
    setProfile((current) => current ? { ...current, verified: data.verified } : current);
    setStatus(data.verified ? "Галочка выдана" : "Галочка снята");
  };

  return (
    <main className="profilePage">
      <header className="profileTopbar"><a className="brand" href="/"><span className="brandMark">К</span><span className="brandName">КИРИЛЛ ПОД ПАРТОЙ: ФИЛЬМ</span></a><a href="/">На главную</a></header>
      {!profile ? <div className="profileLoading">{status}</div> : <section className="profileCard">
        <div className="profileAvatar">{avatar ? <img src={avatar} alt={`Аватар пользователя ${profile.name}`} /> : <span>{profile.name.slice(0, 1).toLocaleUpperCase("ru-RU")}</span>}
          {editing && <label className="avatarUpload">Изменить<input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseAvatar} /></label>}
        </div>
        <div className="profileContent"><span className="profileEyebrow">ПРОФИЛЬ</span><h1>{profile.name}{profile.verified && <span className="verifiedBadge large" title="Подтверждённый профиль" aria-label="Подтверждённый профиль">✓</span>}</h1><strong>@{profile.username}</strong>
          {editing ? <><label className="bioEditor"><span>Описание</span><textarea value={bio} onChange={(event) => setBio(event.target.value)} maxLength={500} rows={6} placeholder="Расскажите немного о себе…" /><small>{bio.length} / 500</small></label><div className="profileActions"><button onClick={() => { setEditing(false); setBio(profile.bio); setAvatar(profile.avatar); }}>Отмена</button><button onClick={save} disabled={saving}>{saving ? "Сохраняем…" : "Сохранить"}</button></div></>
          : <><p className={profile.bio ? "" : "emptyBio"}>{profile.bio || "Пользователь пока ничего о себе не рассказал."}</p><div className="profileOwnerActions">{profile.isOwn && <button className="editProfile" onClick={() => { setEditing(true); setStatus(""); }}>Редактировать профиль</button>}{profile.canManageVerification && <button className={`verificationControl ${profile.verified ? "remove" : ""}`} onClick={toggleVerification} disabled={saving}>{profile.verified ? "Снять галочку" : "Выдать галочку"}<span>✓</span></button>}</div></>}
          {status && <div className="profileStatus" role="status">{status}</div>}
        </div>
      </section>}
    </main>
  );
}
