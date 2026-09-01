"use client";

import { useEffect, useState } from "react";
import SliceModelViewer from "./SliceModelViewer";

type Slot = { slot: number; name: string; mine: boolean };
type State = { user: { name: string } | null; slots: Slot[]; remaining: number };

export default function FigurineSection() {
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const load = () => fetch("/api/preorders", { cache: "no-store" }).then(async (response) => {
    const data = await response.json(); if (!response.ok) throw new Error(data.error); setState(data);
  }).catch((reason) => setError(reason.message || "Не удалось загрузить предзаказы"));
  useEffect(() => { load(); }, []);

  const preorder = async () => {
    if (!state?.user) { window.location.href = "/register?next=%2F%23figurine"; return; }
    setPending(true); setError("");
    const response = await fetch("/api/preorders", { method: "POST" });
    const data = await response.json(); setPending(false);
    if (!response.ok) return setError(data.error || "Не удалось оформить предзаказ");
    setState(data);
  };
  const mine = state?.slots.some((slot) => slot.mine) || false;
  const full = state?.remaining === 0;

  return (
    <section className="figurineSection" id="figurine" aria-labelledby="figurine-title" data-reveal>
      <div className="figurineCopy">
        <span>ПРЕДЗАКАЗ · 5 ЭКЗЕМПЛЯРОВ</span>
        <h2 id="figurine-title">Фигурка<br />Кирилла</h2>
        <p>Да, всё верно! У «Кирилла под партой» появились фигурки. Делаю я их вместе с Никитой на 3D-принтере Bambu Lab.</p>
        <button className="preorderButton" disabled={pending || mine || full} onClick={preorder}>
          {mine ? "Вы уже в предзаказе" : full ? "Все фигурки забронированы" : pending ? "Бронируем…" : state?.user ? "Предзаказать фигурку" : "Войти и предзаказать"}<i>→</i>
        </button>
        {error && <p className="preorderError" role="alert">{error}</p>}
      </div>
      <div className="figurineModel"><SliceModelViewer /><small>Наведите на слой · потяните, чтобы повернуть</small></div>
      <div className="preorderList">
        <div><strong>Предзаказ</strong><span>{state ? `${state.remaining} из 5 свободно` : "Загрузка…"}</span></div>
        <ol>{Array.from({ length: 5 }, (_, index) => { const occupied = state?.slots.find((item) => item.slot === index + 1); return <li className={occupied?.mine ? "mine" : ""} key={index}><span>{String(index + 1).padStart(2, "0")}</span><strong>{occupied?.name || "Свободное место"}</strong><i>{occupied ? "ЗАБРОНИРОВАНО" : "СВОБОДНО"}</i></li>; })}</ol>
      </div>
    </section>
  );
}
