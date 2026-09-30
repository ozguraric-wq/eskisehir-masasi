import type { Metadata } from 'next';
import './globals.css';
import { Header, Footer } from '@/components/news/chrome';
export const metadata: Metadata = {title:{default:'Eskişehir Masası | Eskişehir haberleri ve canlı yayın',template:'%s | Eskişehir Masası'},description:'Eskişehir ve 14 ilçesinden haberler, resmi kurum açıklamaları, kültür sanat, spor ve YouTube canlı yayınları.',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="tr"><body><a className="skip-link" href="#icerik">İçeriğe geç</a><Header/>{children}<Footer/></body></html>}
