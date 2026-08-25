"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function MoviePage() {
  const [isTrailerOpen, setTrailerOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isTrailerOpen && !dialog.open) dialog.showModal();
    if (!isTrailerOpen && dialog.open) dialog.close();
  }, [isTrailerOpen]);

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="На главную">
          <span className="brandMark">К</span>
          <span className="brandName">КИРИЛЛ ПОД ПАРТОЙ: ФИЛЬМ</span>
        </a>
        <nav aria-label="Основная навигация">
          <a href="#about">О фильме</a>
          <button className="searchButton" aria-label="Поиск недоступен" title="Поиск скоро появится">⌕</button>
          <span className="avatar">К</span>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="heroBackdrop" aria-hidden="true">
          <Image src="/Kirill-poster.jpg" alt="" fill priority sizes="100vw" />
        </div>
        <div className="heroVignette" />
        <div className="heroContent">
          <div className="posterWrap">
            <Image className="poster" src="/Kirill-poster.jpg" width={405} height={607} priority alt="Постер фильма «Кирилл под партой: фильм»" />
            <span className="posterBadge">СКОРО</span>
          </div>

          <div className="movieInfo">
            <div className="eyebrow"><span>ФИЛЬМ</span><i />СКОРО</div>
            <h1>Кирилл под партой:<br /><em>фильм</em></h1>
            <p className="meta">2026&nbsp;&nbsp;•&nbsp;&nbsp;Мультфильм&nbsp;&nbsp;•&nbsp;&nbsp;Россия</p>
            <p className="lead">Финальная история Кирилла.</p>
            <div className="actions">
              <button className="primaryButton disabled" disabled><span>▶</span> Смотреть фильм</button>
              <button className="secondaryButton" onClick={() => setTrailerOpen(true)}><span>▶</span> Смотреть тизер</button>
            </div>
            <p className="availability">Полный фильм пока недоступен</p>
          </div>

          <aside className="rating" aria-label="Рейтинг пока недоступен">
            <span>РЕЙТИНГ</span>
            <strong>—</strong>
            <p>Оценки появятся<br />после премьеры</p>
          </aside>
        </div>
      </section>

      <section className="details" id="about">
        <div className="sectionLabel">О ФИЛЬМЕ</div>
        <div className="detailsGrid">
          <div>
            <h2>Последнее прощание.</h2>
            <p className="description">Вот и настала финальная точка<br />мультсериалов про Кирилла…<br />Давайте вместе попрощаемся с<br />этой историей!</p>
          </div>
          <div className="facts">
            <div><span>ГОД</span><strong>2026</strong></div>
            <div><span>СТРАНА</span><strong>Россия</strong></div>
            <div><span>ЖАНР</span><strong>Мультфильм</strong></div>
            <div><span>СТАТУС</span><strong className="accent">Скоро</strong></div>
          </div>
        </div>

        <button className="teaserCard" onClick={() => setTrailerOpen(true)} aria-label="Воспроизвести тизер">
          <Image src="/teaser-cover.jpg" fill sizes="(max-width: 900px) 100vw, 1100px" alt="Первый кадр тизера" />
          <span className="teaserShade" />
          <span className="playCircle">▶</span>
          <span className="teaserCopy"><small>ОФИЦИАЛЬНЫЙ ТИЗЕР</small><b>Смотреть тизер</b></span>
        </button>
      </section>

      <footer><span className="brandMark small">К</span><p>КИРИЛЛ ПОД ПАРТОЙ: ФИЛЬМ</p></footer>

      <dialog ref={dialogRef} className="trailerDialog" onClose={() => setTrailerOpen(false)} onClick={(e) => { if (e.target === e.currentTarget) setTrailerOpen(false); }}>
        <div className="dialogBody">
          <button className="closeButton" onClick={() => setTrailerOpen(false)} aria-label="Закрыть тизер">×</button>
          <video controls autoPlay={isTrailerOpen} poster="/teaser-cover.jpg" src="/teaser.mp4">
            Ваш браузер не поддерживает видео.
          </video>
        </div>
      </dialog>
    </main>
  );
}
