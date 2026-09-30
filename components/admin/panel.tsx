'use client';
import { useCallback, useEffect, useState } from 'react';
import { LayoutDashboard, Newspaper, ImagePlus, Layers, Files, Radio, Settings, History, Globe, Save, Send, Plus, Search, ArrowLeft, ArrowUp, ArrowDown, Eye, Trash2, Download, ExternalLink, Inbox, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { districts, dateLabel } from '@/data/news';
import type { CmsState, CmsArticle } from '@/lib/cms/model';
import './panel.css';
const publicUrl = 'https://ozguraric-wq.github.io/eskisehir-masasi/';
type Release = {
    id: string;
    revision: number;
    status: string;
    created_at: string;
    published_at?: string;
    run_url?: string;
    message?: string;
};
type Media = {
    id: string;
    filename: string;
    size: number;
    alt: string;
    created_at: string;
};
type Revision = {
    id: string;
    revision: number;
    created_at: string;
    actor: string;
    label: string;
};
const tabs = [['overview', 'Yayın masası', LayoutDashboard], ['news', 'Haberler', Newspaper], ['media', 'Görsel kitaplığı', ImagePlus], ['headlines', 'Manşet & bölümler', Layers], ['categories', 'Kategoriler', Layers], ['pages', 'Sayfalar', Files], ['live', 'Canlı yayın & video', Radio], ['inbox', 'Gelen kutusu', Inbox], ['settings', 'Site ayarları', Settings], ['history', 'Sürüm geçmişi', History]] as const;
const slugify = (v: string) => v.toLocaleLowerCase('tr-TR').replace(/[çğıöşü]/g, c => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' }[c] || c)).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const previewImage = (p: string) => p.startsWith('/uploads/') ? '/api/admin/media/file?id=' + p.slice(9) : p;
type ApiMap = {
    state: {
        state: CmsState;
        revision: number;
        updatedAt: string;
        releases: Release[];
        publisherConfigured: boolean;
    };
    restore: {
        state: CmsState;
        revision: number;
        updatedAt: string;
    };
    release: {
        id: string;
    };
    media: {
        items: Media[];
    };
    revisions: {
        items: Revision[];
    };
    inbox: {
        messages: Record<string, string>[];
        comments: Record<string, string>[];
    };
};
async function api<P extends keyof ApiMap>(path: P, data?: unknown): Promise<ApiMap[P]> { const r = await fetch('/api/admin/' + path, { method: data === undefined ? 'GET' : 'POST', headers: data === undefined ? undefined : { 'Content-Type': 'application/json' }, body: data === undefined ? undefined : JSON.stringify(data), cache: 'no-store' }); let value; try {
    value = await r.json();
}
catch {
    throw Error('Oturum veya sunucu yanıtı alınamadı. Sayfayı yenileyin.');
} if (!r.ok)
    throw Error((value as {
        error?: string;
    }).error || 'İşlem tamamlanamadı.'); return value as ApiMap[P]; }
const time = (v?: string) => v ? new Date(v).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }) : 'Henüz yok';
export function AdminPanel({ user }: {
    user: string;
}) {
    const [state, setState] = useState<CmsState | null>(null), [revision, setRevision] = useState(0), [tab, setTab] = useState('overview'), [active, setActive] = useState<string | null>(null), [page, setPage] = useState('kunye'), [dirty, setDirty] = useState(false), [busy, setBusy] = useState(false), [notice, setNotice] = useState(''), [error, setError] = useState(''), [updated, setUpdated] = useState<string>(), [releases, setReleases] = useState<Release[]>([]), [media, setMedia] = useState<Media[]>([]), [history, setHistory] = useState<Revision[]>([]), [inbox, setInbox] = useState<{
        messages: Record<string, string>[];
        comments: Record<string, string>[];
    }>({ messages: [], comments: [] }), [query, setQuery] = useState(''), [filter, setFilter] = useState('all'), [preview, setPreview] = useState(false), [picker, setPicker] = useState(false), [newName, setNewName] = useState(''), [newSlug, setNewSlug] = useState(''), [publishedConfigured, setPublishedConfigured] = useState(false);
    const load = useCallback(async () => { try {
        const data = await api('state');
        setState(data.state);
        setRevision(data.revision);
        setUpdated(data.updatedAt);
        setReleases(data.releases);
        setPublishedConfigured(data.publisherConfigured);
        setError('');
    }
    catch (e) {
        setError((e as Error).message);
    } }, []);
    useEffect(() => { load(); }, [load]);
    useEffect(() => { const handler = (e: BeforeUnloadEvent) => { if (dirty)
        e.preventDefault(); }; window.addEventListener('beforeunload', handler); return () => window.removeEventListener('beforeunload', handler); }, [dirty]);
    useEffect(() => { if (tab === 'media' || picker)
        api('media').then(d => setMedia(d.items)).catch(e => setError(e.message)); if (tab === 'history')
        api('revisions').then(d => setHistory(d.items)).catch(e => setError(e.message)); if (tab === 'inbox')
        api('inbox').then(setInbox).catch(e => setError(e.message)); }, [tab, picker]);
    const change = (fn: (s: CmsState) => CmsState) => { setState(s => s ? fn(s) : s); setDirty(true); setNotice(''); };
    const article = state?.articles.find(a => a.id === active);
    const edit = (patch: Partial<CmsArticle>) => change(s => ({ ...s, articles: s.articles.map(a => a.id === active ? { ...a, ...patch } : a) }));
    async function save() { if (!state || busy)
        return; setBusy(true); setError(''); try {
        const result = await api('state', { state, revision, label: article ? 'Haber: ' + article.title : tabs.find(t => t[0] === tab)?.[1] + ' güncellendi' });
        setState(result.state);
        setRevision(result.revision);
        setUpdated(result.updatedAt);
        setDirty(false);
        setNotice('Değişiklikler güvenle kaydedildi. Sitede görünmesi için yayın kuyruğuna alın.');
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    async function publish() { if (dirty) {
        setError('Yayınlamadan önce değişiklikleri kaydedin.');
        return;
    } setBusy(true); setError(''); try {
        await api('release', { revision });
        const d = await api('state');
        setReleases(d.releases);
        setNotice('Yayın paketi sıraya alındı. GitHub aktarımı tamamlandığında yayın durumunu burada görebilirsiniz.');
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    async function upload(file: File) { setBusy(true); setError(''); try {
        const f = new FormData();
        f.append('file', file);
        f.append('alt', file.name);
        const r = await fetch('/api/admin/media', { method: 'POST', body: f });
        const d = await r.json() as {
            error?: string;
            path: string;
        };
        if (!r.ok)
            throw Error(d.error);
        const list = await api('media');
        setMedia(list.items);
        if (picker) {
            edit({ image: d.path, imageCredit: article?.imageCredit || 'Eskişehir Masası' });
            setPicker(false);
        }
        setNotice('Görsel kitaplığa kaydedildi.');
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    function createArticle() { const id = 'haber-' + Date.now(); change(s => ({ ...s, articles: [{ id, slug: id, title: 'Yeni haber', summary: '', body: [''], date: new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' }), source: 'Eskişehir Masası', sourceUrl: '', image: '', categories: ['eskisehir'], district: 'eskisehir', status: 'draft' }, ...s.articles] })); setTab('news'); setActive(id); }
    function backup() { if (!state)
        return; const href = URL.createObjectURL(new Blob([JSON.stringify({ revision, state }, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = href; a.download = 'eskisehir-masasi-yedek-' + new Date().toISOString().slice(0, 10) + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(href), 5000); }
    const move = (ids: string[], index: number, by: number) => { const copy = [...ids]; [copy[index], copy[index + by]] = [copy[index + by], copy[index]]; return copy; };
    function addCategory() { if (!newName.trim() || !newSlug.trim()) {
        setError('Kategori adı ve bağlantısı gerekli.');
        return;
    } if (state?.categories.some(c => c[0] === newSlug)) {
        setError('Bu kategori bağlantısı zaten kullanılıyor.');
        return;
    } change(s => ({ ...s, categories: [...s.categories, [newSlug, newName.trim()]] })); setNewName(''); setNewSlug(''); }
    function addPage() { if (!newName.trim() || !newSlug.trim() || state?.pages[newSlug]) {
        setError('Benzersiz bir sayfa adı ve bağlantısı girin.');
        return;
    } change(s => ({ ...s, pages: { ...s.pages, [newSlug]: { title: newName.trim(), paragraphs: [''] } } })); setPage(newSlug); setNewName(''); setNewSlug(''); }
    const stats = state ? { published: state.articles.filter(a => a.status === 'published').length, draft: state.articles.filter(a => a.status === 'draft').length, trash: state.articles.filter(a => a.status === 'trash').length } : null;
    const filePicker = <label className="cms-button"><ImagePlus size={17}/> Görsel yükle<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={busy} onChange={e => { const file = e.target.files?.[0]; if (file)
        upload(file); e.target.value = ''; }} className="cms-file-input"/></label>;
    const mediaGrid = <div className="cms-media-grid">{media.map(m => <article className="cms-media-card" key={m.id}><img src={'/api/admin/media/file?id=' + m.id} alt={m.alt} loading="lazy"/><b>{m.filename}</b><small>{Math.ceil(m.size / 1024)} KB · {time(m.created_at)}</small>{picker ? <button className="cms-button" onClick={() => { edit({ image: '/uploads/' + m.id }); setPicker(false); }}>Kapak olarak seç</button> : <button className="cms-text-button" onClick={async () => { try {
        await navigator.clipboard.writeText('/uploads/' + m.id);
        setNotice('Görsel yolu kopyalandı. Haber veya galeri alanına ekleyebilirsiniz.');
    }
    catch {
        setNotice('/uploads/' + m.id);
    } }}>Görsel yolunu kopyala</button>}</article>)}{!media.length && <p className="cms-empty">Yeni yüklediğiniz görseller burada görünür. Mevcut haber fotoğrafları haber düzenleyicisinde korunur.</p>}</div>;
    return <main id="icerik" className="cms-shell"><aside className="cms-sidebar"><a href={publicUrl} target="_blank" rel="noopener noreferrer" className="cms-brand"><img src="/brand-symbol.png" alt=""/><span>ESKİŞEHİR<br /><strong>MASASI</strong><small>YAYIN YÖNETİMİ</small></span></a><nav aria-label="Yönetim menüsü">{tabs.map(([key, label, Icon]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => { setTab(key); setNewName(''); setNewSlug(''); }}><Icon size={18}/>{label}{key === 'news' && stats && <small>{stats.published + stats.draft}</small>}</button>)}</nav><div className="cms-user"><span>YAYIN YÖNETİCİSİ</span><b>{user}</b><a href="/signout-with-chatgpt?return_to=%2Fyonetim" target="_top">Güvenli çıkış</a></div></aside><div className="cms-workspace" inert={busy}><header className="cms-top"><div><span className="cms-kicker">ESKİŞEHİR MASASI</span><h1>{tabs.find(t => t[0] === tab)?.[1]}</h1></div><a className="cms-button cms-outline" href={publicUrl} target="_blank" rel="noopener noreferrer"><Globe size={16}/> Siteyi aç <ExternalLink size={14}/></a></header><div className="cms-status" role="status">{error ? <div className="cms-alert error"><AlertCircle size={18}/>{error}<button onClick={() => setError('')} aria-label="Uyarıyı kapat">×</button></div> : notice ? <div className="cms-alert success"><CheckCircle2 size={18}/>{notice}</div> : null}</div>{!state ? <div className="cms-card"><p>{error ? 'Yönetim verisi yüklenemedi.' : 'Yayın masası yükleniyor…'}</p>{error && <button className="cms-button" onClick={load}>Yeniden dene</button>}</div> : <>
 {tab === 'overview' && <><div className="cms-welcome"><div><h2>Şehrin gündemi sizin masanızda.</h2><p>Haberleri hazırlayın, manşeti düzenleyin ve yayını yönetin.</p></div><button className="cms-button" onClick={createArticle}><Plus size={17}/> Yeni haber</button></div><div className="cms-stats">{[['Yayın için hazır', stats!.published], ['Taslak haber', stats!.draft], ['Kategori', state.categories.length], ['İlçe', 14]].map(([label, n]) => <div className="cms-stat" key={label}><span>{label}</span><strong>{n}</strong></div>)}</div><div className="cms-columns"><section className="cms-card"><h2>Son düzenlenen haberler</h2><div className="cms-recent">{state.articles.filter(a => a.status !== 'trash').slice(0, 6).map(a => <button key={a.id} onClick={() => { setActive(a.id); setTab('news'); }}><img src={previewImage(a.image) || '/brand-symbol.png'} alt=""/><span><strong>{a.title}</strong><small>{a.source} · {a.date}</small></span><span className={'cms-badge ' + a.status}>{a.status === 'published' ? 'Yayına hazır' : 'Taslak'}</span></button>)}</div></section><section className="cms-card"><h2>GitHub yayın durumu</h2><p className="cms-muted">Kaydetmek çalışma alanını günceller. Yayın kuyruğu yalnızca “Yayına hazır” haberleri ve kaydedilmiş site ayarlarını gönderir.</p>{!publishedConfigured && <div className="cms-notice">İlk otomatik aktarım henüz doğrulanmadı. Yayın bağlantısı kurulana kadar mevcut GitHub yayını çalışmaya devam eder.</div>}<button className="cms-text-button" onClick={async () => { try {
            const d = await api('state');
            setReleases(d.releases);
            setPublishedConfigured(d.publisherConfigured);
            setNotice('Yayın durumu yenilendi.');
        }
        catch (e) {
            setError((e as Error).message);
        } }}><RefreshIcon /> Durumu yenile</button>{releases.slice(0, 4).map(r => <div className="cms-release" key={r.id}><span className={'cms-badge ' + r.status}>{r.status === 'published' ? 'Yayında' : r.status === 'failed' ? 'Aktarım hatası' : 'Sırada'}</span><strong>Sürüm {r.revision}</strong><small>{time(r.published_at || r.created_at)}</small>{r.run_url && <a href={r.run_url} target="_blank" rel="noopener noreferrer">Yayın kaydını aç ↗</a>}{r.message && <p>{r.message}</p>}</div>)}{!releases.length && <p className="cms-empty">Henüz yayın paketi oluşturulmadı.</p>}<a className="cms-text-button" href="https://github.com/ozguraric-wq/eskisehir-masasi/actions" target="_blank" rel="noopener noreferrer">GitHub yayın geçmişi ↗</a></section></div></>}
 {tab === 'news' && (article ? <><div className="cms-toolbar"><button className="cms-button cms-outline" onClick={() => setActive(null)}><ArrowLeft size={16}/> Haber listesi</button><div><button className="cms-button cms-outline" onClick={() => setPreview(true)}><Eye size={16}/> Önizle</button><button className="cms-button cms-outline" onClick={() => { edit({ status: article.status === 'trash' ? 'draft' : 'trash' }); setActive(null); }}><Trash2 size={16}/>{article.status === 'trash' ? 'Geri al' : 'Çöpe taşı'}</button></div></div><div className="cms-editor"><section className="cms-card"><Field label="Haber başlığı"><input value={article.title} maxLength={220} onChange={e => edit({ title: e.target.value })}/></Field><Field label="Haber bağlantısı"><div className="cms-input-prefix"><span>/haber/</span><input value={article.slug} onChange={e => edit({ slug: slugify(e.target.value) })}/></div></Field><Field label="Spot / kısa özet"><textarea rows={3} maxLength={600} value={article.summary} onChange={e => edit({ summary: e.target.value })}/><small>{article.summary.length}/600 karakter</small></Field><Field label="Haber metni"><textarea rows={15} value={article.body.join('\n\n')} onChange={e => edit({ body: e.target.value.split(/\n\n/) })}/><small>Paragrafları boş satırla ayırın. Metin güvenli biçimde yayımlanır.</small></Field><details className="cms-details"><summary>Arama motoru bilgileri</summary><Field label="SEO başlığı (isteğe bağlı)"><input value={article.seoTitle || ''} maxLength={160} onChange={e => edit({ seoTitle: e.target.value })}/></Field><Field label="SEO açıklaması"><textarea rows={2} value={article.seoDescription || ''} maxLength={320} onChange={e => edit({ seoDescription: e.target.value })}/></Field></details></section><aside><section className="cms-card"><h2>Yayın bilgileri</h2><Field label="Durum"><select value={article.status} onChange={e => edit({ status: e.target.value as CmsArticle['status'] })}><option value="draft">Taslak</option><option value="published">Yayına hazır</option><option value="trash">Çöp kutusu</option></select></Field><Field label="Haber tarihi"><input type="date" value={article.date} onChange={e => edit({ date: e.target.value })}/></Field><Field label="İlçe"><select value={article.district} onChange={e => edit({ district: e.target.value })}><option value="eskisehir">Eskişehir geneli</option>{districts.map(d => <option key={d[0]} value={d[0]}>{d[1]}</option>)}</select></Field><fieldset className="cms-checks"><legend>Kategoriler</legend>{state.categories.map(c => <label key={c[0]}><input type="checkbox" checked={article.categories.includes(c[0])} onChange={e => edit({ categories: e.target.checked ? [...article.categories, c[0]] : article.categories.filter(x => x !== c[0]) })}/>{c[1]}</label>)}</fieldset><label className="cms-checkbox"><input type="checkbox" checked={article.isArchive || false} onChange={e => edit({ isArchive: e.target.checked })}/> Arşiv haberi</label></section><section className="cms-card"><h2>Kapak görseli</h2>{article.image && <img className="cms-cover" src={previewImage(article.image)} alt={article.title}/>}<button className="cms-button cms-outline" onClick={() => setPicker(true)}><ImagePlus size={16}/> Görsel seç / yükle</button><Field label="Görsel yolu veya HTTPS adresi"><input value={article.image} onChange={e => edit({ image: e.target.value })}/></Field><Field label="Fotoğraf kaynağı / telif"><input value={article.imageCredit || ''} onChange={e => edit({ imageCredit: e.target.value })}/></Field><Field label="Galeri görselleri (her satıra bir yol)"><textarea rows={3} value={(article.gallery || []).join('\n')} onChange={e => edit({ gallery: e.target.value.split('\n').filter(Boolean) })}/></Field></section><section className="cms-card"><h2>Kaynak bilgisi</h2><Field label="Kaynak kurum / yazar"><input value={article.source} onChange={e => edit({ source: e.target.value })}/></Field><Field label="Özgün açıklama bağlantısı"><input type="url" value={article.sourceUrl} onChange={e => edit({ sourceUrl: e.target.value })}/></Field><Field label="YouTube video kimliği (11 karakter)"><input value={article.videoId || ''} maxLength={11} onChange={e => edit({ videoId: e.target.value })}/></Field></section></aside></div></> : <><div className="cms-toolbar"><div className="cms-search"><Search size={18}/><input placeholder="Başlık, kaynak veya ilçe ara" value={query} onChange={e => setQuery(e.target.value)}/></div><select aria-label="Haber durumuna göre filtrele" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Tüm haberler</option><option value="published">Yayına hazır</option><option value="draft">Taslaklar</option><option value="trash">Çöp kutusu</option></select><button className="cms-button" onClick={createArticle}><Plus size={16}/> Yeni haber</button></div><div className="cms-card cms-table-wrap"><table className="cms-table"><thead><tr><th>Haber</th><th>Kaynak / Tarih</th><th>Durum</th><th>İşlem</th></tr></thead><tbody>{state.articles.filter(a => (filter === 'all' ? a.status !== 'trash' : a.status === filter) && [a.title, a.source, a.district].join(' ').toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr'))).map(a => <tr key={a.id}><td><button className="cms-row-title" onClick={() => setActive(a.id)}><img src={previewImage(a.image) || '/brand-symbol.png'} alt=""/><strong>{a.title}</strong></button></td><td>{a.source}<small>{a.date}</small></td><td><span className={'cms-badge ' + a.status}>{a.status === 'published' ? 'Yayına hazır' : a.status === 'draft' ? 'Taslak' : 'Çöp kutusu'}</span></td><td><button className="cms-text-button" onClick={() => setActive(a.id)}>Düzenle</button></td></tr>)}</tbody></table></div></>)}
 {tab === 'media' && <section className="cms-card"><div className="cms-toolbar"><div><h2>Görsel kitaplığı</h2><p className="cms-muted">PNG, JPEG, WebP veya GIF · En fazla 8 MB</p></div>{filePicker}</div>{mediaGrid}</section>}
 {tab === 'headlines' && <div className="cms-columns"><section className="cms-card"><h2>Manşet sıralaması</h2><p className="cms-muted">İlk haber ana manşettir. Taslak ve çöp kutusundaki haberler yayına dahil edilmez.</p>{state.settings.headlineIds.map((id, i) => { const a = state.articles.find(a => a.id === id); return a ? <div className="cms-order" key={id}><b>{String(i + 1).padStart(2, '0')}</b><img src={previewImage(a.image)} alt=""/><span>{a.title}</span><div><button title="Yukarı" aria-label={a.title + ' yukarı'} disabled={i === 0} onClick={() => change(s => ({ ...s, settings: { ...s.settings, headlineIds: move(s.settings.headlineIds, i, -1) } }))}><ArrowUp size={15}/></button><button title="Aşağı" aria-label={a.title + ' aşağı'} disabled={i === state.settings.headlineIds.length - 1} onClick={() => change(s => ({ ...s, settings: { ...s.settings, headlineIds: move(s.settings.headlineIds, i, 1) } }))}><ArrowDown size={15}/></button><button aria-label={a.title + ' manşetten çıkar'} onClick={() => change(s => ({ ...s, settings: { ...s.settings, headlineIds: s.settings.headlineIds.filter(x => x !== id) } }))}>×</button></div></div> : null; })}<Field label="Manşete haber ekle"><select value="" onChange={e => { if (e.target.value)
            change(s => ({ ...s, settings: { ...s.settings, headlineIds: [...s.settings.headlineIds, e.target.value] } })); }}><option value="">Haber seçin…</option>{state.articles.filter(a => a.status !== 'trash' && !state.settings.headlineIds.includes(a.id)).map(a => <option key={a.id} value={a.id}>{a.title}</option>)}</select></Field></section><section className="cms-card"><h2>Ana sayfaya yeni bölüm</h2><p className="cms-muted">Ek bölümler, fotoğraf galerisinin altında seçilen kategorinin son dört haberini gösterir.</p>{state.settings.homeSections.map((h, i) => <div className="cms-section-edit" key={i}><Field label="Bölüm başlığı"><input value={h.title} onChange={e => change(s => ({ ...s, settings: { ...s.settings, homeSections: s.settings.homeSections.map((x, k) => k === i ? { ...x, title: e.target.value } : x) } }))}/></Field><Field label="Kategori"><select value={h.category} onChange={e => change(s => ({ ...s, settings: { ...s.settings, homeSections: s.settings.homeSections.map((x, k) => k === i ? { ...x, category: e.target.value } : x) } }))}>{state.categories.map(c => <option key={c[0]} value={c[0]}>{c[1]}</option>)}</select></Field><button className="cms-text-button danger" onClick={() => change(s => ({ ...s, settings: { ...s.settings, homeSections: s.settings.homeSections.filter((_, k) => k !== i) } }))}>Bölümü kaldır</button></div>)}<button className="cms-button cms-outline" onClick={() => change(s => ({ ...s, settings: { ...s.settings, homeSections: [...s.settings.homeSections, { title: 'Yeni bölüm', category: s.categories[0][0] }] } }))}><Plus size={16}/> Bölüm ekle</button></section></div>}
 {tab === 'categories' && <section className="cms-card"><h2>Kategoriler ve menü sırası</h2><p className="cms-muted">Haberlerde veya ana sayfa bölümlerinde kullanılan kategori korunur. Yeni kategorinin alt sayfası yayınla birlikte oluşur.</p>{state.categories.map(([slug, name], i) => <div className="cms-category" key={slug}><input aria-label={slug + ' kategori adı'} value={name} onChange={e => change(s => ({ ...s, categories: s.categories.map((c, k) => k === i ? [slug, e.target.value] : c) }))}/><code>/kategori/{slug}</code><small>{state.articles.filter(a => a.categories.includes(slug) && a.status !== 'trash').length} haber</small><button aria-label={name + ' yukarı'} disabled={i === 0} onClick={() => change(s => { const c = [...s.categories]; [c[i], c[i - 1]] = [c[i - 1], c[i]]; return { ...s, categories: c }; })}><ArrowUp size={15}/></button><button aria-label={name + ' kaldır'} disabled={slug === 'eskisehir' || state.articles.some(a => a.categories.includes(slug)) || state.settings.homeSections.some(h => h.category === slug)} onClick={() => change(s => ({ ...s, categories: s.categories.filter(c => c[0] !== slug) }))}><Trash2 size={15}/></button></div>)}<div className="cms-add-row"><Field label="Yeni kategori adı"><input value={newName} onChange={e => { setNewName(e.target.value); setNewSlug(slugify(e.target.value)); }}/></Field><Field label="Bağlantı"><input value={newSlug} onChange={e => setNewSlug(slugify(e.target.value))}/></Field><button className="cms-button" onClick={addCategory}><Plus size={16}/> Kategori ekle</button></div></section>}
 {tab === 'pages' && <div className="cms-columns cms-page-columns"><section className="cms-card"><h2>Sayfalar</h2><div className="cms-page-list">{Object.entries(state.pages).map(([slug, p]) => <button className={slug === page ? 'active' : ''} key={slug} onClick={() => setPage(slug)}>{p.title}<small>/sayfa/{slug}</small></button>)}</div><Field label="Yeni sayfa adı"><input value={newName} onChange={e => { setNewName(e.target.value); setNewSlug(slugify(e.target.value)); }}/></Field><Field label="Bağlantı"><input value={newSlug} onChange={e => setNewSlug(slugify(e.target.value))}/></Field><button className="cms-button" onClick={addPage}><Plus size={16}/> Sayfa ekle</button></section><section className="cms-card">{state.pages[page] && <><h2>Sayfa düzenleyici</h2><Field label="Sayfa başlığı"><input value={state.pages[page].title} onChange={e => change(s => ({ ...s, pages: { ...s.pages, [page]: { ...s.pages[page], title: e.target.value } } }))}/></Field><Field label="İçerik"><textarea rows={18} value={state.pages[page].paragraphs.join('\n\n')} onChange={e => change(s => ({ ...s, pages: { ...s.pages, [page]: { ...s.pages[page], paragraphs: e.target.value.split(/\n\n/) } } }))}/></Field><p className="cms-muted">Boş satırlar yeni paragraf oluşturur. Yeni sayfalar site altındaki bağlantılara eklenir.</p><a className="cms-text-button" href={publicUrl + 'sayfa/' + page + '/'} target="_blank" rel="noopener noreferrer">Yayımlanan sayfayı aç ↗</a></>}</section></div>}
 {tab === 'live' && <><div className="cms-columns"><section className="cms-card"><h2>YouTube canlı yayın</h2><p className="cms-muted">Video veya kanal kimliği kaydedip yayın paketine ekleyin. Boş bırakılırsa “Yayın bekleniyor” gösterilir.</p><Field label="Canlı video kimliği (11 karakter)"><input value={state.live.YOUTUBE_LIVE_VIDEO_ID} onChange={e => change(s => ({ ...s, live: { ...s.live, YOUTUBE_LIVE_VIDEO_ID: e.target.value.trim() } }))} placeholder="YouTube video ID"/></Field><Field label="YouTube kanal kimliği (UC ile başlar)"><input value={state.live.YOUTUBE_CHANNEL_ID} onChange={e => change(s => ({ ...s, live: { ...s.live, YOUTUBE_CHANNEL_ID: e.target.value.trim() } }))} placeholder="UC…"/></Field></section><section className="cms-card"><h2>Yayın bağlantısını bulma</h2><p className="cms-muted">youtube.com/watch?v= adresindeki “v=” sonrası bölüm video kimliğidir. Kanal kimliği YouTube Studio → Ayarlar → Kanal → Gelişmiş ayarlardan alınabilir.</p><a className="cms-button cms-outline" href="https://studio.youtube.com/" target="_blank" rel="noopener noreferrer">YouTube Studio ↗</a></section></div><section className="cms-card"><div className="cms-toolbar"><h2>Video arşivi</h2><button className="cms-button cms-outline" onClick={() => change(s => ({ ...s, videos: [...s.videos, { slug: 'video-' + Date.now(), title: 'Yeni video', publisher: 'Eskişehir Masası', source_url: '', video_url: '', poster: '' }] }))}><Plus size={16}/> Video ekle</button></div>{state.videos.map((v, i) => <div className="cms-video-edit" key={v.slug}><Field label="Video başlığı"><input value={v.title} onChange={e => change(s => ({ ...s, videos: s.videos.map((x, k) => k === i ? { ...x, title: e.target.value } : x) }))}/></Field><Field label="YouTube kimliği"><input value={v.youtube_id || ''} onChange={e => change(s => ({ ...s, videos: s.videos.map((x, k) => k === i ? { ...x, youtube_id: e.target.value || undefined } : x) }))}/></Field><Field label="Doğrudan MP4 / kaynak video URL"><input value={v.video_url || ''} onChange={e => change(s => ({ ...s, videos: s.videos.map((x, k) => k === i ? { ...x, video_url: e.target.value } : x) }))}/></Field><Field label="Kaynak kurum"><input value={v.publisher} onChange={e => change(s => ({ ...s, videos: s.videos.map((x, k) => k === i ? { ...x, publisher: e.target.value } : x) }))}/></Field><Field label="Kaynak sayfa URL"><input value={v.source_url} onChange={e => change(s => ({ ...s, videos: s.videos.map((x, k) => k === i ? { ...x, source_url: e.target.value } : x) }))}/></Field><button className="cms-text-button danger" onClick={() => change(s => ({ ...s, videos: s.videos.filter((_, k) => k !== i) }))}>Videoyu kaldır</button></div>)}</section></>}
 {tab === 'inbox' && <div className="cms-columns">{[['messages', 'Okur mesajları'], ['comments', 'Haber yorumları']].map(([key, title]) => <section className="cms-card" key={key}><h2>{title}</h2><p className="cms-muted">Sunucudaki kayıtlar. GitHub sürümünde okur gönderimi henüz açık değildir.</p>{inbox[key as 'messages' | 'comments'].map(m => <article className="cms-message" key={m.id}><strong>{m.name} · {m.subject || m.article_id}</strong><small>{m.email || ''} {new Date(Number(m.created_at)).toLocaleString('tr-TR')}</small><p>{m.body}</p></article>)}{!inbox[key as 'messages' | 'comments'].length && <p className="cms-empty">Henüz kayıt yok.</p>}</section>)}</div>}
 {tab === 'settings' && <section className="cms-card cms-settings"><h2>Yayın ayarları</h2><Field label="Site adı"><input value={state.settings.siteTitle} onChange={e => change(s => ({ ...s, settings: { ...s.settings, siteTitle: e.target.value } }))}/></Field><Field label="Okur iletişim e-postası"><input type="email" value={state.settings.contactEmail} onChange={e => change(s => ({ ...s, settings: { ...s.settings, contactEmail: e.target.value.trim() } }))}/><small>Eklendiğinde iletişim sayfasında tıklanabilir bağlantı gösterilir.</small></Field><div className="cms-notice">Yönetim paneli yalnızca yayın sahibinin hesabına açıktır. Görseller ve taslaklar sunucuda saklanır.</div><button className="cms-button cms-outline" onClick={backup}><Download size={16}/> İçerik yedeğini indir</button><p className="cms-muted" style={{ marginTop: 15 }}>Yedek dosyası haber, kategori, sayfa ve ayarları içerir. Görsel dosyaları kitaplıkta saklanmaya devam eder.</p></section>}
 {tab === 'history' && <section className="cms-card"><h2>Kayıt geçmişi</h2><p className="cms-muted">Son 30 sürüm. Geri yükleme yeni bir kayıt oluşturur; yayındaki site, yeni yayın paketi gönderilene kadar korunur.</p><table className="cms-table"><thead><tr><th>Sürüm</th><th>Değişiklik</th><th>Yönetici / Zaman</th><th>İşlem</th></tr></thead><tbody>{history.map(h => <tr key={h.id}><td>#{h.revision}</td><td>{h.label}</td><td>{h.actor}<small>{time(h.created_at)}</small></td><td><button className="cms-text-button" disabled={busy || dirty || h.revision === revision} onClick={async () => { if (!confirm('Çalışma alanı ' + h.revision + '. sürüme dönecek. Mevcut sürüm geçmişte korunur. Devam edilsin mi?'))
            return; setBusy(true); try {
            const d = await api('restore', { id: h.id, revision });
            setState(d.state);
            setRevision(d.revision);
            setUpdated(d.updatedAt);
            setNotice('Önceki sürüm geri yüklendi.');
            setHistory((await api('revisions')).items);
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setBusy(false);
        } }}>Geri yükle</button></td></tr>)}</tbody></table>{!history.length && <p className="cms-empty">İlk kayıttan sonra sürümler burada görünür.</p>}</section>}
 <footer className="cms-savebar"><div><span className={dirty ? 'cms-unsaved' : ''}>{dirty ? '● Kaydedilmemiş değişiklikler' : '✓ Kayıtlar güncel'}</span><small>Sürüm {revision} · {time(updated)}</small></div><div><button className="cms-button cms-outline" disabled={busy || !dirty} onClick={save}><Save size={16}/> {busy ? 'İşleniyor…' : 'Değişiklikleri kaydet'}</button><button className="cms-button" disabled={busy || dirty} onClick={publish}><Send size={16}/> Yayın kuyruğuna al</button></div></footer>
 </>}</div><Dialog open={preview} onOpenChange={setPreview}><DialogContent className="cms-preview"><DialogTitle>Haber önizlemesi</DialogTitle>{article && <><span className="cms-badge draft">ÖNİZLEME</span><h1>{article.title}</h1><p className="cms-preview-deck">{article.summary}</p><small>{article.source} · {article.date}</small>{article.image && <img src={previewImage(article.image)} alt={article.title}/>}<div className="article-text">{article.body.map((p, i) => <p key={i}>{p}</p>)}</div></>}</DialogContent></Dialog><Dialog open={picker} onOpenChange={setPicker}><DialogContent className="cms-preview"><DialogTitle>Kapak görseli seç</DialogTitle>{filePicker}{mediaGrid}</DialogContent></Dialog></main>;
}
function Field({ label, children }: {
    label: string;
    children: React.ReactNode;
}) { return <label className="cms-field"><span>{label}</span>{children}</label>; }
function RefreshIcon() { return <Clock size={14}/>; }
