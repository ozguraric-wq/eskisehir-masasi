import {notFound} from 'next/navigation';
import {districts,districtName,newest} from '@/data/news';
import {Listing} from '@/components/news/listing';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){return {title:districtName((await params).slug)+' Haberleri'}}
export default async function Page({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{sayfa?:string}>}){const {slug}=await params;const {sayfa}=await searchParams;if(!districts.some(d=>d[0]===slug))notFound();return <Listing title={districtName(slug)} description={districtName(slug)+' ilçesinden belediye, kaymakamlık ve yerel gündem haberleri.'} items={newest().filter(a=>a.district===slug)} basePath={'/ilceler/'+slug} page={Number(sayfa||1)}><div className="source-links"><a href={'https://www.'+slug+'.gov.tr/'} target="_blank" rel="noopener noreferrer">{districtName(slug)} Kaymakamlığı</a></div></Listing>}
