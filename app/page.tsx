"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import ModelViewer from "./ModelViewer";

const productionImages = [
  { src: "/production-blender.png", alt: "3D-модель головы Кирилла в Blender 5.1.0" },
  { src: "/production-character.png", alt: "Полная 3D-модель Кирилла с системой костей в Blender 5.1.0" },
  { src: "/production-face-closeup.png", alt: "Крупный план глаз 3D-модели Кирилла в Blender 5.1.0" }
];

const russianAlphabet = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
const wallpaperWord = "КИРИЛЛОМ";

const caesarEncode = (word: string, shift: number) => word.split("").map((letter) => {
  const index = russianAlphabet.indexOf(letter);
  return index < 0 ? letter : russianAlphabet[(index + shift) % russianAlphabet.length];
}).join("");

export default function MoviePage() {
  const [isTrailerOpen, setTrailerOpen] = useState(false);
  const [productionImage, setProductionImage] = useState(0);
  const [cipherShift, setCipherShift] = useState(1);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const galleryTouchStart = useRef<number | null>(null);

  const changeProductionImage = (direction: number) => {
    setProductionImage((current) => (current + direction + productionImages.length) % productionImages.length);
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isTrailerOpen && !dialog.open) dialog.showModal();
    if (!isTrailerOpen) {
      videoRef.current?.pause();
      if (dialog.open) dialog.close();
    }
  }, [isTrailerOpen]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCipherShift((current) => current >= russianAlphabet.length - 1 ? 1 : current + 1);
    }, 90);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const mobileByInput = window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
    const mobileByBrowser = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    const device = mobileByInput || mobileByBrowser ? "mobile" : "desktop";
    document.documentElement.dataset.device = device;
    document.body.dataset.device = device;
    return () => {
      delete document.documentElement.dataset.device;
      delete document.body.dataset.device;
    };
  }, []);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -7% 0px" });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

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
        <div className="heroContent" data-reveal>
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
        <div className="detailsGrid" data-reveal>
          <div className="aboutLead">
            <h2>Последнее прощание.</h2>
            <p className="description">Вот и настала финальная точка мультсериалов про Кирилла… Давайте вместе попрощаемся с этой историей!</p>
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

        <section className="voiceCast" aria-labelledby="voice-cast-title" data-reveal>
          <div className="voiceCastHeading">
            <span>АКТЁРСКИЙ СОСТАВ</span>
            <h2 id="voice-cast-title">Роли<br />озвучивают</h2>
            <p>Список может пополняться</p>
          </div>
          <ol className="voiceCastList">
            <li><span>01</span><strong>Кирилл Горностаев</strong></li>
            <li><span>02</span><strong>Платон Точилин</strong></li>
            <li><span>03</span><strong>Александр Пугин</strong></li>
          </ol>
        </section>

        <section className="production" aria-labelledby="production-title" data-reveal>
          <div className="productionHeading">
            <span>ПРОЦЕСС СОЗДАНИЯ</span>
            <h2 id="production-title">О производстве<br />фильма</h2>
            <p>Сейчас фильм создаётся в Blender 5.1.0. Монтаж будет выполнен в CapCut, а 2D-часть — нарисована в IbisPaint X.</p>
          </div>
          <figure className="productionVisual">
            <div
              className="productionImage"
              tabIndex={0}
              aria-label={`Галерея производства, изображение ${productionImage + 1} из ${productionImages.length}`}
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft") changeProductionImage(-1);
                if (event.key === "ArrowRight") changeProductionImage(1);
              }}
              onTouchStart={(event) => { galleryTouchStart.current = event.touches[0].clientX; }}
              onTouchEnd={(event) => {
                if (galleryTouchStart.current === null) return;
                const distance = event.changedTouches[0].clientX - galleryTouchStart.current;
                if (Math.abs(distance) > 45) changeProductionImage(distance > 0 ? -1 : 1);
                galleryTouchStart.current = null;
              }}
            >
              <Image key={productionImages[productionImage].src} src={productionImages[productionImage].src} fill sizes="(max-width: 900px) 100vw, 720px" alt={productionImages[productionImage].alt} />
              <button type="button" className="galleryArrow previous" onClick={() => changeProductionImage(-1)} aria-label="Предыдущее изображение" />
              <button type="button" className="galleryArrow next" onClick={() => changeProductionImage(1)} aria-label="Следующее изображение" />
              <span className="galleryCounter">{String(productionImage + 1).padStart(2, "0")} / {String(productionImages.length).padStart(2, "0")}</span>
            </div>
            <div className="galleryDots" aria-label="Выбор изображения">
              {productionImages.map((image, index) => (
                <button key={image.src} className={index === productionImage ? "active" : ""} onClick={() => setProductionImage(index)} aria-label={`Показать изображение ${index + 1}`} aria-current={index === productionImage ? "true" : undefined} />
              ))}
            </div>
          </figure>
          <ol className="productionSteps">
            <li><span>01</span><div><strong>3D-производство</strong><small>Blender 5.1.0</small></div></li>
            <li><span>02</span><div><strong>Монтаж</strong><small>CapCut</small></div></li>
            <li><span>03</span><div><strong>2D-графика</strong><small>IbisPaint X</small></div></li>
          </ol>
        </section>

        <section className="modelShowcase" aria-labelledby="model-title" data-reveal>
          <div className="modelIntro">
            <div>
              <span>ИНТЕРАКТИВНАЯ МОДЕЛЬ</span>
              <h2 id="model-title">Рассмотрите<br />Кирилла в 3D</h2>
            </div>
            <p>Зажмите и потяните модель, чтобы повернуть её. Используйте колёсико мыши или жест двумя пальцами для приближения.</p>
          </div>
          <ModelViewer />
        </section>

        <button className="teaserCard" onClick={() => setTrailerOpen(true)} aria-label="Воспроизвести тизер" data-reveal>
          <Image src="/teaser-cover.jpg" fill sizes="(max-width: 900px) 100vw, 1100px" alt="Первый кадр тизера" />
          <span className="teaserShade" />
          <span className="playCircle">▶</span>
          <span className="teaserCopy"><small>ОФИЦИАЛЬНЫЙ ТИЗЕР</small><b>Смотреть тизер</b></span>
        </button>

        <section className="wallpaperSection" aria-labelledby="wallpaper-title" data-reveal>
          <div className="wallpaperPreview">
            <div className="phoneFrame">
              <Image src="/wallpaper.png" width={1177} height={2560} sizes="(max-width: 640px) 52vw, 250px" alt="Тематические обои «Кирилл под партой» для телефона" />
            </div>
          </div>
          <div className="wallpaperContent">
            <span>ДЛЯ ТЕЛЕФОНА</span>
            <h2 id="wallpaper-title" aria-label="Обои с Кириллом">Обои с<br /><span className="cipherWord" key={cipherShift}>{caesarEncode(wallpaperWord, cipherShift)}</span></h2>
            <p>Тематические обои для экрана телефона в полном разрешении 1177 × 2560.</p>
            <a className="downloadWallpaper" href="/wallpaper.png" download="wallpaper.png">
              Скачать PNG <i aria-hidden="true">↓</i>
            </a>
            <small>PNG · 1177 × 2560</small>
          </div>
        </section>
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
