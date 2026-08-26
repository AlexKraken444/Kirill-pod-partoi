"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import ModelViewer from "./ModelViewer";

export default function MoviePage() {
  const [isTrailerOpen, setTrailerOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isTrailerOpen && !dialog.open) dialog.showModal();
    if (!isTrailerOpen) {
      videoRef.current?.pause();
      if (dialog.open) dialog.close();
    }
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
            <p className="meta">2027&nbsp;&nbsp;•&nbsp;&nbsp;фантастика, приключения&nbsp;&nbsp;•&nbsp;&nbsp;Россия</p>
            <p className="lead">Финальная история Кирилла.</p>
            <div className="actions">
              <button className="primaryButton disabled" disabled><span>▶</span> Смотреть фильм</button>
              <button className="secondaryButton" onClick={() => setTrailerOpen(true)}><span>▶</span> Смотреть тизер</button>
            </div>
            <p className="availability">Полный фильм пока недоступен</p>
          </div>

          <aside className="rating" aria-label="Рейтинг пока недоступен">
            <span>РЕЙТИНГ</span>
            <div className="ratingStars" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, index) => <i className="ratingStar" key={index} />)}
            </div>
            <p>Оценки появятся<br />после премьеры</p>
          </aside>
        </div>
      </section>

      <section className="details" id="about">
        <div className="sectionLabel">О ФИЛЬМЕ</div>
        <div className="detailsGrid">
          <div className="aboutLead">
            <h2>Последнее прощание.</h2>
            <p className="description">Вот и настала финальная точка<br />мультсериалов про Кирилла…<br />Давайте вместе попрощаемся с<br />этой историей!</p>
          </div>
          <dl className="movieFacts">
            <div><dt>Год производства</dt><dd>2027</dd></div>
            <div><dt>Страна</dt><dd>Россия</dd></div>
            <div><dt>Жанр</dt><dd>фантастика, приключения</dd></div>
            <div><dt>Слоган</dt><dd>—</dd></div>
            <div><dt>Режиссёр</dt><dd>Александр Пугин</dd></div>
            <div><dt>Сценарий</dt><dd>Александр Пугин</dd></div>
          </dl>
        </div>

        <section className="production" aria-labelledby="production-title">
          <div className="productionHeading">
            <span>ПРОЦЕСС СОЗДАНИЯ</span>
            <h2 id="production-title">О производстве<br />фильма</h2>
            <p>Сейчас фильм создаётся в Blender 5.1.0. Монтаж будет выполнен в CapCut, а 2D-часть — нарисована в IbisPaint X.</p>
          </div>
          <figure className="productionVisual">
            <div className="productionImage">
              <Image src="/production-blender.png" fill sizes="(max-width: 900px) 100vw, 720px" alt="3D-модель головы Кирилла в Blender 5.1.0" />
            </div>
            <figcaption><span>РАБОЧИЙ ПРОЦЕСС</span> 3D-модель головы Кирилла в Blender</figcaption>
          </figure>
          <ol className="productionSteps">
            <li><span>01</span><div><strong>3D-производство</strong><small>Blender 5.1.0</small></div></li>
            <li><span>02</span><div><strong>Монтаж</strong><small>CapCut</small></div></li>
            <li><span>03</span><div><strong>2D-графика</strong><small>IbisPaint X</small></div></li>
          </ol>
        </section>

        <section className="modelShowcase" aria-labelledby="model-title">
          <div className="modelIntro">
            <div>
              <span>ИНТЕРАКТИВНАЯ МОДЕЛЬ</span>
              <h2 id="model-title">Рассмотрите<br />Кирилла в 3D</h2>
            </div>
            <p>Зажмите и потяните модель, чтобы повернуть её. Используйте колёсико мыши или жест двумя пальцами для приближения.</p>
          </div>
          <ModelViewer />
          <div className="viewerHints" aria-hidden="true">
            <span>↔ Вращение</span><span>＋ Масштаб</span><span>◎ Сброс вида</span>
          </div>
        </section>

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
          <video ref={videoRef} controls autoPlay={isTrailerOpen} poster="/teaser-cover.jpg" src="/teaser.mp4">
            Ваш браузер не поддерживает видео.
          </video>
        </div>
      </dialog>
    </main>
  );
}
