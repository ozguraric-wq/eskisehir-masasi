import Link from 'next/link';
import {newest,shortDate} from '@/data/news';
import {Breadcrumbs} from '@/components/news/listing';
export const metadata={title:'Son Haberler'};
export default function Page(){return <main id="icerik" className="container page-content"><Breadcrumbs label="Son Haberler"/><div className="page-heading"><h1>Haber akışı</h1><p>Eskişehir’in gündemi, kaynakların yayın tarihine göre.</p></div><div className="timeline">{newest().map(a=><Link key={a.id} href={'/haber/'+a.slug}><span className="timeline-date">{shortDate(a.date)}</span><img src={a.image} alt="" loading="lazy"/><div><small>{a.source}</small><h2>{a.title}</h2><p>{a.summary}</p></div></Link>)}</div></main>}
