"use client";

import { FormEvent, useEffect, useState } from "react";

export default function RegisterPage() {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" }).then((r) => r.json()).then((data) => {
      if (data.user) window.location.replace(new URLSearchParams(window.location.search).get("next") || "/");
    }).catch(() => undefined);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true); setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), username: form.get("username"), password: form.get("password") })
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) return setError(data.error || "Что-то пошло не так");
    const requested = new URLSearchParams(window.location.search).get("next") || "/";
    const destination = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";
    window.location.replace(destination);
  }

  return (
    <main className="authPage">
      <a className="authBrand" href="/"><span className="brandMark">К</span><span>КИРИЛЛ ПОД ПАРТОЙ: ФИЛЬМ</span></a>
      <section className="authPanel">
        <span className="authEyebrow">АККАУНТ</span>
        <h1>{mode === "register" ? "Регистрация" : "Вход"}</h1>
        <p>Создайте профиль, чтобы участвовать в жизни сайта и пользоваться его возможностями.</p>
        <form onSubmit={submit}>
          {mode === "register" && <label><span>Ваше имя</span><input name="name" autoComplete="name" minLength={2} maxLength={50} required placeholder="Как вас показать в списке" /></label>}
          <label><span>Логин</span><input name="username" autoComplete="username" minLength={3} maxLength={30} required placeholder="kirill_fan" /></label>
          <label><span>Пароль</span><input name="password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={8} maxLength={128} required placeholder="Не менее 8 символов" /></label>
          {error && <div className="authError" role="alert">{error}</div>}
          <button disabled={pending}>{pending ? "Подождите…" : mode === "register" ? "Создать аккаунт" : "Войти"}<i>→</i></button>
        </form>
        <button className="authSwitch" onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(""); }}>
          {mode === "register" ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}
        </button>
      </section>
    </main>
  );
}
