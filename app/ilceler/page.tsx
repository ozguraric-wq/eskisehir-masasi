import Link from 'next/link';
import {MapPin} from 'lucide-react';
import {districts,newest} from '@/data/news';
import {Listing} from '@/components/news/listing';
export const metadata={title:'İlçe Haberleri'};
export default async function Page({searchParams}:{searchParams:Promise<{sayfa?:string}>}){const {sayfa}=await searchParams;const items=newest().filter(a=>a.district!=='eskisehir');return <Listing title="14 ilçe, tek gündem" description="Merkezden kırsala, Eskişehir’in bütün ilçelerinden haberler." items={items} page={Number(sayfa||1)} basePath="/ilceler"><div className="district-directory">{districts.map(d=><Link key={d[0]} href={'/ilceler/'+d[0]}><MapPin size={15}/>{d[1]}<small>{items.filter(a=>a.district===d[0]).length}</small></Link>)}</div></Listing>}
