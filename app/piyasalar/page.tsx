import {MarketsPage} from '@/components/news/markets';
import {Breadcrumbs} from '@/components/news/listing';
export const metadata={title:'Döviz, altın ve kripto piyasaları'};
export default function Page(){return <main id="icerik" className="container page-content"><Breadcrumbs label="Piyasalar"/><div className="page-heading"><h1>Döviz, altın ve kripto</h1><p>Kaynağı ve veri zamanı açık piyasa göstergeleri.</p></div><MarketsPage/></main>}
