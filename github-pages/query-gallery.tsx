'use client';

import {Suspense} from 'react';
import {useSearchParams} from 'next/navigation';
import {Gallery} from '@/components/news/media';
import type {Article} from '@/data/news';

function SelectedGallery({articles}: {articles: Article[]}) {
  const slug = useSearchParams().get('haber') || undefined;
  return <Gallery key={slug || 'all'} articles={articles} initialSlug={slug}/>;
}

export function QueryGallery({articles}: {articles: Article[]}) {
  return <Suspense fallback={<Gallery articles={articles}/>}>
    <SelectedGallery articles={articles}/>
  </Suspense>;
}
