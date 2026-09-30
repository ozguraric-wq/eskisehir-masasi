'use client';

import {Suspense, type ReactNode} from 'react';
import {useSearchParams} from 'next/navigation';
import {Listing} from '@/components/news/listing';
import {categoryName, districtName, type Article} from '@/data/news';
import {sitePath} from '@/lib/paths';

type Props = {
  title: string;
  description: string;
  items: Article[];
  basePath: string;
  search?: boolean;
  children?: ReactNode;
};

const normalize = (value: string) => value.toLocaleLowerCase('tr-TR')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');

function QueryResults({search = false, ...props}: Props) {
  const params = useSearchParams();
  const query = search ? params.get('q') || '' : '';
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
  const items = search ? props.items.filter(article => terms.every(term =>
    normalize([article.title, article.summary, article.source,
      districtName(article.district), ...article.categories.map(categoryName)]
      .join(' ')).includes(term))) : props.items;
  return <Listing {...props} items={items} query={query}
    page={Number(params.get('sayfa') || 1)}
    description={search && query ? `“${query}” için arama sonuçları` : props.description}>
    {search && <form action={sitePath('/ara/')} className="search-page-form">
      <input key={query} type="search" name="q" defaultValue={query}
        placeholder="Haber, kurum, ilçe…" aria-label="Arama kelimesi"/>
      <button type="submit" className="red-button">Ara</button>
    </form>}
    {props.children}
  </Listing>;
}

export function QueryListing(props: Props) {
  return <Suspense fallback={<Listing {...props}/>}>
    <QueryResults {...props}/>
  </Suspense>;
}
