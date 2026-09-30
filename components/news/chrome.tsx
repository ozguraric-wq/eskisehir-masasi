'use client';
import Link from 'next/link';
import {useState,useEffect,useRef} from 'react';
import {usePathname} from 'next/navigation';
import {sitePath} from '@/lib/paths';
import {MarketTicker} from './markets';
import customPages from '@/data/pages.json';
import {Search,Menu,Radio,ChevronDown,TvMinimal,CloudSun,Rss,Home,Clock3,MapPin,ArrowUp,X} from 'lucide-react';
import {Sheet,SheetContent,SheetTitle,SheetTrigger,SheetClose,SheetDescription} from '@/components/ui/sheet';
import {Dialog,DialogContent,DialogTitle,DialogDescription,DialogClose} from '@/components/ui/dialog';
import {categories,districts} from '@/data/news';

export function Brand({inverse=false}:{inverse?:boolean}) {
  return <Link href="/" className={'brand '+(inverse?'inverse':'')} aria-label="Eskişehir Masası ana sayfa"><img className="brand-symbol" src={sitePath('/brand-microphone-26.png')} alt="" width={56} height={88}/><span className="brand-name">eskişehir<span>masası<span className="brand-period">.</span></span></span></Link>;
}

export function Header() {
  const [search,setSearch]=useState(false);
  const [open,setOpen]=useState(false);
  const path=usePathname();
  const current=path?.replace(/\/$/,'')||'/';
  useEffect(()=>{setSearch(false);setOpen(false)},[path]);
  useEffect(()=>{
    const keyboard=(event:KeyboardEvent)=>{
      const target=event.target as HTMLElement;
      if(target?.isContentEditable||target?.closest('input,textarea,select'))return;
      if(((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k')||event.key==='/'){
        event.preventDefault();setSearch(true);
      }
    };
    document.addEventListener('keydown',keyboard);
    return()=>document.removeEventListener('keydown',keyboard);
  },[]);
  return <>
    <MarketTicker/>
    <div className="utility"><div className="container utility-inner"><div><Link href="/son-dakika">Son Haberler</Link><span className="utility-sep"/>{districts.slice(0,5).map(d=><Link key={d[0]} href={'/ilceler/'+d[0]}>{d[1]}</Link>)}</div><Link href="/sayfa/resmi-ilanlar">Resmî İlanlar</Link></div></div>
    <div className="masthead-wrap"><header className="masthead container"><Brand/><div className="masthead-middle"><span className="edition">ŞEHRİN GÜNDEMİ, AYNI MASADA.</span><span>Eskişehir ve 14 ilçesinden haberler.</span></div><div className="masthead-actions"><Link href="/sayfa/hava-durumu" className="weather"><CloudSun size={24}/><span>Eskişehir<small>Hava durumu</small></span></Link><Link href="/canli-yayin" className="live-button"><Radio size={17}/> <span>CANLI YAYIN</span></Link></div></header></div>
    <div className="nav-wrap"><nav className="container main-nav" aria-label="Ana menü">
      <Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><button type="button" className="menu-button" aria-label="Tüm kategorileri aç"><Menu size={22}/></button></SheetTrigger>
        <SheetContent side="left" className="drawer" showCloseButton={false}><SheetClose className="search-close" aria-label="Menüyü kapat"><X size={22}/></SheetClose><SheetTitle className="sr-only">Eskişehir Masası menüsü</SheetTitle><SheetDescription className="sr-only">Haber kategorileri, ilçeler ve yayınlara erişin.</SheetDescription><Brand/>
          <div className="drawer-quick"><Link href="/" onClick={()=>setOpen(false)}><Home size={19}/> Ana Sayfa</Link><Link href="/son-dakika" onClick={()=>setOpen(false)}><Clock3 size={19}/> Son Haberler</Link></div>
          <p className="drawer-label">HABER KATEGORİLERİ</p>
          <div className="drawer-category-grid">{categories.map(c=><Link key={c[0]} href={'/kategori/'+c[0]} onClick={()=>setOpen(false)} aria-current={current==='/kategori/'+c[0]?'page':undefined}>{c[1]}</Link>)}</div>
          <details className="drawer-districts"><summary>İlçeler <ChevronDown size={18}/></summary><div><Link href="/ilceler" onClick={()=>setOpen(false)}>Tüm ilçeler</Link>{districts.map(d=><Link key={d[0]} href={'/ilceler/'+d[0]} onClick={()=>setOpen(false)}>{d[1]}</Link>)}</div></details>
          <div className="drawer-links" onClick={()=>setOpen(false)}><Link href="/foto-galeri">Foto Galeri</Link><Link href="/videolar">Videolar</Link><Link href="/canli-yayin">Canlı Yayın</Link><Link href="/sayfa/sehir-rehberi">Şehir Rehberi</Link><a href="https://deprem.afad.gov.tr/" target="_blank" rel="noopener noreferrer">Son Depremler</a><Link href="/sayfa/hava-durumu">Hava Durumu</Link><a href="/rss.xml">RSS</a></div>
        </SheetContent>
      </Sheet>
      <DistrictMenu/>
      <div className="nav-links">{categories.slice(0,12).map(c=><Link key={c[0]} href={'/kategori/'+c[0]} aria-current={current==='/kategori/'+c[0]?'page':undefined}>{c[1]}</Link>)}</div>
      <button type="button" className="search-toggle" aria-label="Haber ara" aria-expanded={search} onClick={()=>setSearch(true)}><Search size={21}/></button>
    </nav></div>
    <Dialog open={search} onOpenChange={setSearch}><DialogContent className="search-dialog" showCloseButton={false}>
      <DialogClose className="search-close" aria-label="Aramayı kapat"><X size={22}/></DialogClose>
      <DialogTitle>Hangi haberi arıyorsunuz?</DialogTitle><DialogDescription>Haber, kurum veya ilçe adıyla arayın.</DialogDescription>
      <form action="/ara" role="search"><Search size={22}/><input type="search" name="q" placeholder="Örneğin: Tepebaşı, eğitim…" aria-label="Aranacak haber" autoFocus required/><button type="submit">Ara</button></form>
      <div className="search-shortcuts"><span>Hızlı erişim</span>{[['eskisehir','Eskişehir'],['ekonomi','Ekonomi'],['spor','Spor'],['kultur-sanat','Kültür Sanat']].map(([slug,label])=><Link key={slug} href={'/kategori/'+slug} onClick={()=>setSearch(false)}>{label}</Link>)}</div>
      <small className="search-key-hint">Açmak için Ctrl / ⌘ + K · Kapatmak için Esc</small>
    </DialogContent></Dialog>
    <nav className="mobile-bottom-nav" aria-label="Mobil hızlı erişim">
      <Link href="/" aria-current={current==='/'?'page':undefined}><Home size={20}/><span>Ana Sayfa</span></Link>
      <Link href="/son-dakika" aria-current={current==='/son-dakika'?'page':undefined}><Clock3 size={20}/><span>Haberler</span></Link>
      <Link href="/ilceler" aria-current={current.startsWith('/ilceler')?'page':undefined}><MapPin size={20}/><span>İlçeler</span></Link>
      <button type="button" onClick={()=>setSearch(true)} aria-expanded={search}><Search size={20}/><span>Ara</span></button>
      <Link href="/canli-yayin" aria-current={current==='/canli-yayin'?'page':undefined}><Radio size={20}/><span>Canlı</span></Link>
    </nav>
  </>;
}
export function Footer(){return <footer><div className="container"><div className="footer-top"><Brand inverse/><p>Eskişehir’in gündemini birlikte takip ediyoruz.</p><Link href="/canli-yayin"><TvMinimal size={23}/> Eskişehir Masası TV</Link></div><div className="footer-columns"><div><h3>HABERLER</h3><div className="footer-grid">{categories.map(c=><Link key={c[0]} href={'/kategori/'+c[0]}>{c[1]}</Link>)}</div></div><div><h3>İLÇELER</h3><div className="footer-grid">{districts.map(c=><Link key={c[0]} href={'/ilceler/'+c[0]}>{c[1]}</Link>)}</div></div><div><h3>ESKİŞEHİR MASASI</h3><div className="footer-grid single">{[['kunye','Künye'],['iletisim','İletişim'],['yayin-ilkeleri','Yayın İlkeleri'],['gizlilik','Gizlilik ve Veri Politikası'],['cerez-politikasi','Çerez Politikası'],['yorum-kurallari','Yorum Kuralları'],['okur-temsilcisi','Okur Temsilcisi'],['duzeltme','Düzeltme ve Yanıt Hakkı'],...Object.entries(customPages).filter(([slug])=>!['kunye','iletisim','yayin-ilkeleri','gizlilik','cerez-politikasi','yorum-kurallari','okur-temsilcisi','duzeltme'].includes(slug)).map(([slug,p])=>[slug,(p as {title:string}).title])].map(c=><Link key={c[0]} href={'/sayfa/'+c[0]}>{c[1]}</Link>)}</div></div></div><div className="footer-bottom"><span>© 2026 Eskişehir Masası</span><Link href="/yonetim">Yönetim</Link><span>Haberlerde özgün kurum kaynakları belirtilmiştir.</span><a href="/rss.xml"><Rss size={15}/> RSS</a></div><p className="footer-credit"><a href="https://rateldijital.com/" target="_blank" rel="noopener noreferrer">Ratel Dijital</a> tarafından geliştirilmiştir.</p></div></footer>}


function DistrictMenu() {
  const [expanded,setExpanded]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  const path=usePathname();
  useEffect(()=>setExpanded(false),[path]);
  useEffect(()=>{const close=(e:PointerEvent)=>{if(!ref.current?.contains(e.target as Node))setExpanded(false)};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close)},[]);
  return <div className="district-menu" ref={ref} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node))setExpanded(false)}} onKeyDown={e=>{if(e.key==='Escape'){setExpanded(false);ref.current?.querySelector('button')?.focus()}}}>
    <button type="button" onClick={()=>setExpanded(!expanded)} aria-expanded={expanded} aria-controls="district-navigation"><MapPin size={16}/> İlçeler <ChevronDown size={14}/></button>
    {expanded&&<div id="district-navigation" className="district-dropdown"><Link href="/ilceler" onClick={()=>setExpanded(false)}>Tüm ilçe haberleri</Link><div>{districts.map(([slug,label])=><Link key={slug} href={'/ilceler/'+slug} onClick={()=>setExpanded(false)}>{label}</Link>)}</div></div>}
  </div>;
}
function BackToTop() {
  const [visible,setVisible]=useState(false);
  useEffect(()=>{const update=()=>setVisible(window.scrollY>650);update();window.addEventListener('scroll',update,{passive:true});return()=>window.removeEventListener('scroll',update)},[]);
  return visible?<button type="button" className="back-to-top" aria-label="Sayfanın başına dön" onClick={()=>window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}><ArrowUp size={21}/></button>:null;
}
export function SiteChrome({children}:{children:React.ReactNode}) {
  const path=usePathname();
  return path?.startsWith('/yonetim')?<>{children}</>:<><Header/>{children}<Footer/><BackToTop/></>;
}
