import videos from '@/data/videos.json';
import {Breadcrumbs} from '@/components/news/listing';
import {VideoPlayer} from '@/components/news/media';
export const metadata={title:'Videolar'};
export function VideoCollection({analysis=false}:{analysis?:boolean}){return <main id="icerik" className="container page-content"><Breadcrumbs label={analysis?"Video Analiz":"Videolar"}/><div className="page-heading"><h1>{analysis?"Video Analiz":"Şehrin görüntüsü"}</h1><p>Eskişehir ve Odunpazarı belediyelerinin kamuya açık video arşivlerinden.</p></div><div className="video-grid">{videos.map(v=><article className="video-entry" key={v.slug}><VideoPlayer youtubeId={'youtube_id'in v?v.youtube_id:undefined} videoUrl={v.video_url} title={v.title} poster={v.poster}/><h2>{v.title}</h2><p>{v.publisher} · Kurum video arşivi</p><a href={v.source_url} target="_blank" rel="noopener noreferrer">Kaynak sayfasını aç</a></article>)}</div></main>}

export default function Page(){return <VideoCollection/>}
