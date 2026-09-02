"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type RawPost = {
  id: string;
  parentId: string | null;
  name: string;
  text: string;
  createdAt: string;
};

type Thread = RawPost & { replies: RawPost[] };
type User = { name: string; username: string };

const formatDate = (date: string) => new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit"
}).format(new Date(date));

const initial = (name: string) => name.trim().charAt(0).toUpperCase() || "?";

export default function Discussion() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable" | "error">("loading");
  const [user, setUser] = useState<User | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const loadPosts = useCallback(async () => {
    try {
      const response = await fetch("/api/discussion", { cache: "no-store" });
      if (response.status === 503) {
        setStatus("unavailable");
        return;
      }
      if (!response.ok) throw new Error("load failed");
      const data = await response.json() as { posts: RawPost[] };
      const roots = data.posts.filter((post) => !post.parentId).map((post) => ({ ...post, replies: [] as RawPost[] }));
      const rootsById = new Map(roots.map((post) => [post.id, post]));
      data.posts.filter((post) => post.parentId).forEach((reply) => rootsById.get(reply.parentId || "")?.replies.push(reply));
      roots.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      setThreads(roots);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void loadPosts();
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setUser(data.user || null))
      .catch(() => setUser(null))
      .finally(() => setSessionReady(true));
  }, [loadPosts]);

  const totalMessages = useMemo(
    () => threads.reduce((total, thread) => total + 1 + thread.replies.length, 0),
    [threads]
  );

  const send = async (event: FormEvent, parentId: string | null = null) => {
    event.preventDefault();
    if (!user) {
      window.location.href = "/register?next=%2F%23discussion";
      return;
    }
    const submittedText = (parentId ? replyText : text).trim();
    if (!submittedText) {
      setMessage("Напишите сообщение.");
      return;
    }

    setSending(true);
    setMessage("");
    try {
      const response = await fetch("/api/discussion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: submittedText, parentId, website: "" })
      });
      const data = await response.json() as { post?: RawPost; error?: string };
      if (!response.ok || !data.post) throw new Error(data.error || "Не удалось отправить сообщение");

      if (parentId) {
        setThreads((current) => current.map((thread) => thread.id === parentId
          ? { ...thread, replies: [...thread.replies, data.post as RawPost] }
          : thread));
        setReplyText("");
        setReplyTo(null);
      } else {
        setThreads((current) => [{ ...data.post as RawPost, replies: [] }, ...current]);
        setText("");
      }
      setMessage("Сообщение опубликовано.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось отправить сообщение");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="discussion" id="discussion" aria-labelledby="discussion-title" data-reveal>
      <div className="discussionHeader">
        <div>
          <span>БЕЗ ОЦЕНОК</span>
          <h2 id="discussion-title">Обсуждение<br />фильма</h2>
        </div>
        <p>Поделитесь впечатлениями, идеями или ожиданиями от фильма. Отвечайте другим участникам и продолжайте разговор.</p>
      </div>

      {status === "loading" && <div className="discussionState"><i />Загрузка обсуждения</div>}
      {status === "unavailable" && (
        <div className="discussionState unavailable">
          <strong>Обсуждение скоро откроется</strong>
          <span>Раздел уже готов и ожидает подключения хранилища.</span>
        </div>
      )}
      {status === "error" && (
        <div className="discussionState unavailable">
          <strong>Не удалось загрузить сообщения</strong>
          <button onClick={() => { setStatus("loading"); void loadPosts(); }}>Попробовать снова</button>
        </div>
      )}

      {status === "ready" && (
        <>
          {!sessionReady ? <div className="discussionAuthGate">Проверяем аккаунт…</div> : !user ? (
            <div className="discussionAuthGate">
              <span>УЧАСТИЕ В ОБСУЖДЕНИИ</span>
              <strong>Зарегистрируйтесь, чтобы написать сообщение</strong>
              <p>Читать обсуждение можно без аккаунта. Для публикации и ответов потребуется регистрация.</p>
              <a href="/register?next=%2F%23discussion">Регистрация <i>→</i></a>
            </div>
          ) : <form className="discussionComposer" onSubmit={(event) => void send(event)}>
            <div className="composerTopline">
              <strong>Новое сообщение · {user.name}</strong>
              <span>{totalMessages} {totalMessages === 1 ? "сообщение" : "сообщений"}</span>
            </div>
            <label>
              <span>Текст</span>
              <textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={800} placeholder="Напишите, что думаете о фильме…" rows={4} />
              <small>{text.length} / 800</small>
            </label>
            <input className="discussionTrap" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <div className="composerActions">
              <p role="status" aria-live="polite">{message}</p>
              <button type="submit" disabled={sending}>{sending ? "Отправка…" : "Опубликовать"}<i>↗</i></button>
            </div>
          </form>}

          <div className="discussionFeed">
            {threads.length === 0 && (
              <div className="discussionEmpty"><span>01</span><strong>Начните обсуждение</strong><p>Здесь пока тихо. Оставьте первое сообщение о фильме.</p></div>
            )}
            {threads.map((thread) => (
              <article className="discussionThread" key={thread.id}>
                <div className="commentAvatar" aria-hidden="true">{initial(thread.name)}</div>
                <div className="commentBody">
                  <header><strong>{thread.name}</strong><time dateTime={thread.createdAt}>{formatDate(thread.createdAt)}</time></header>
                  <p>{thread.text}</p>
                  <button className="replyButton" onClick={() => {
                    if (!user) { window.location.href = "/register?next=%2F%23discussion"; return; }
                    setReplyTo((current) => current === thread.id ? null : thread.id);
                    setMessage("");
                  }}>Ответить</button>

                  {thread.replies.length > 0 && (
                    <div className="replyList">
                      {thread.replies.map((reply) => (
                        <article className="discussionReply" key={reply.id}>
                          <div className="commentAvatar small" aria-hidden="true">{initial(reply.name)}</div>
                          <div className="commentBody">
                            <header><strong>{reply.name}</strong><time dateTime={reply.createdAt}>{formatDate(reply.createdAt)}</time></header>
                            <p>{reply.text}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  {replyTo === thread.id && (
                    <form className="replyComposer" onSubmit={(event) => void send(event, thread.id)}>
                      <strong>Ответ для {thread.name}</strong>
                      <textarea value={replyText} onChange={(event) => setReplyText(event.target.value)} maxLength={800} placeholder="Напишите ответ…" rows={3} autoFocus />
                      <div><button type="button" onClick={() => setReplyTo(null)}>Отмена</button><button type="submit" disabled={sending}>{sending ? "Отправка…" : "Ответить"}</button></div>
                    </form>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
