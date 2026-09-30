import {articles} from '@/data/news';
import {Breadcrumbs} from '@/components/news/listing';
import {Gallery} from '@/components/news/media';
export const metadata={title:'Foto Galeri'};
export default async function Page({searchParams}:{searchParams:Promise<{haber?:string}>}){const {haber}=await searchParams;return <main id="icerik" className="container page-content"><Breadcrumbs label="Foto Galeri"/><div className="page-heading"><h1>Fotoğraflarla Eskişehir</h1><p>Şehrin gündeminden kareler, resmi kurumların fotoğraf arşivlerinden.</p></div><Gallery articles={articles.filter(a=>a.gallery&&a.gallery.length>1)} initialSlug={haber}/></main>}
