'use client';

import Link from 'next/link';
import {useEffect, useRef, useState} from 'react';
import {ChevronLeft, ChevronRight, MoveHorizontal} from 'lucide-react';
import {Carousel, CarouselContent, CarouselItem, type CarouselApi} from '@/components/ui/carousel';
import {type Article, categoryName, shortDate} from '@/data/news';

export function Hero({items}: {items: Article[]}) {
  const root = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!api) return;
    const select = () => {
      const selected = api.selectedScrollSnap();
      setIndex(selected);
      const focusedSlide = document.activeElement?.closest('.hero-slide');
      if (focusedSlide && root.current?.contains(focusedSlide) && api.slideNodes()[selected] !== focusedSlide) {
        root.current.focus({preventScroll: true});
      }
    };
    select(); api.on('select', select); api.on('reInit', select);
    return () => { api.off('select', select); api.off('reInit', select); };
  }, [api]);

  if (!items.length) return null;
  return <Carousel ref={root} className="hero hero-carousel" setApi={setApi}
    opts={{loop: items.length > 1, align: 'start', duration: reducedMotion ? 0 : 28, dragThreshold: 8}}
    aria-label="Manşet haberleri" aria-roledescription="kaydırılabilir haberler" tabIndex={0}>
    <CarouselContent className="hero-track">
      {items.map((article, i) => <CarouselItem key={article.id} className="hero-slide"
        aria-roledescription="manşet" aria-label={`${i + 1} / ${items.length}`}
        aria-hidden={index !== i}>
        <Link className="hero-story" href={'/haber/' + article.slug} tabIndex={index === i ? 0 : -1} draggable={false}>
          <img src={article.image} alt="" draggable={false}
            loading={i === 0 ? 'eager' : 'lazy'} fetchPriority={i === 0 ? 'high' : 'auto'}/>
          <div className="hero-shade"/>
          <div className="hero-copy">
            <span className="hero-category">{categoryName(article.categories.find(c => c !== 'eskisehir') || 'eskisehir')}</span>
            <h2>{article.title}</h2>
            <p>{article.summary}</p>
            <span className="hero-meta"><span>{article.source}</span><i/>{shortDate(article.date)}</span>
          </div>
        </Link>
      </CarouselItem>)}
    </CarouselContent>
    <div className="hero-toolbar">
      <span className="hero-count" aria-live="polite" aria-atomic="true"><b>{String(index + 1).padStart(2, '0')}</b><span>/ {String(items.length).padStart(2, '0')}</span></span>
      <div className="hero-pages" aria-label="Manşet seçin">
        {items.map((article, i) => <button type="button" key={article.id} onClick={() => api?.scrollTo(i)}
          className={index === i ? 'active' : ''} aria-label={`${i + 1}. manşet: ${article.title}`} aria-pressed={index === i}>
          {String(i + 1).padStart(2, '0')}
        </button>)}
      </div>
      <span className="hero-swipe-hint"><MoveHorizontal size={17}/> Kaydırın</span>
      <div className="hero-arrows">
        <button type="button" aria-label="Önceki manşet" disabled={items.length < 2} onClick={() => api?.scrollPrev()}><ChevronLeft size={21}/></button>
        <button type="button" aria-label="Sonraki manşet" disabled={items.length < 2} onClick={() => api?.scrollNext()}><ChevronRight size={21}/></button>
      </div>
    </div>
  </Carousel>;
}
