import {VideoCollection} from '@/app/videolar/page';
import {notFound} from 'next/navigation';
import {categories,newest,categoryName} from '@/data/news';
import {Listing} from '@/components/news/listing';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return {title:categoryName(slug)+' Haberleri'};}
export default async function Page({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{sayfa?:string}>}){const {slug}=await params;const q=await searchParams;if(!categories.some(c=>c[0]===slug))notFound();if(slug==='video-analiz')return <VideoCollection analysis/>;return <Listing title={categoryName(slug)} description={'Eskişehir’den '+categoryName(slug).toLocaleLowerCase('tr-TR')+' haberleri ve resmi kurumların açıklamaları.'} items={newest().filter(a=>a.categories.includes(slug))} page={Number(q.sayfa||1)} basePath={'/kategori/'+slug}/>}
