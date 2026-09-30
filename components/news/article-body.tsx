'use client';

import {useEffect, useState} from 'react';
import {Minus, Plus, Type} from 'lucide-react';

export function ArticleBody({paragraphs}: {paragraphs: string[]}) {
  const [size, setSize] = useState(19);
  useEffect(() => {
    try { const saved = Number(localStorage.getItem('em-reading-size')); if ([17,19,21,23].includes(saved)) setSize(saved); } catch {}
  }, []);
  function change(value: number) {
    setSize(value);
    try { localStorage.setItem('em-reading-size', String(value)); } catch {}
  }
  return <section className="reading-section" aria-label="Haber metni">
    <div className="reading-toolbar"><span><Type size={17}/> Okuma görünümü</span>
      <div role="group" aria-label="Haber yazı boyutu">
        <button type="button" onClick={() => change(size - 2)} disabled={size <= 17} aria-label="Yazıyı küçült"><Minus size={17}/></button>
        <span aria-live="polite">{size} px</span>
        <button type="button" onClick={() => change(size + 2)} disabled={size >= 23} aria-label="Yazıyı büyüt"><Plus size={17}/></button>
      </div>
    </div>
    <div className="article-text" style={{fontSize: `${size / 16}rem`}}>{paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div>
  </section>;
}
