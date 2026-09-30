import type { Metadata } from 'next';
import './globals.css';
import settings from '@/data/settings.json';
import { SiteChrome } from '@/components/news/chrome';
export const metadata: Metadata = {title:{default:settings.siteTitle+' | Eskişehir haberleri ve canlı yayın',template:'%s | '+settings.siteTitle},description:'Eskişehir ve 14 ilçesinden haberler, resmi kurum açıklamaları, kültür sanat, spor ve YouTube canlı yayınları.',icons:{icon:'/brand-microphone-26.png',shortcut:'/brand-microphone-26.png'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="tr"><body><a className="skip-link" href="#icerik">İçeriğe geç</a><SiteChrome>{children}</SiteChrome></body></html>}
