'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TrendingUp, RefreshCw } from 'lucide-react';
type Quote = {
    id: string;
    label: string;
    unit: string;
    value?: number;
    change?: number;
    asOf?: string;
    basis: string;
    source: string;
    stale?: boolean;
};
const initial: Quote[] = [{ id: 'usd', label: 'DOLAR', unit: '₺', basis: 'önceki iş gününe göre', source: 'Frankfurter / ECB' }, { id: 'eur', label: 'EURO', unit: '₺', basis: 'önceki iş gününe göre', source: 'Frankfurter / ECB' }, { id: 'gold', label: 'GRAM ALTIN', unit: '₺', basis: 'önceki yenilemeye göre', source: 'Gold API × ECB USD/TRY / 31,1034768' }, { id: 'btc', label: 'BITCOIN', unit: '$', basis: 'UTC gün açılışına göre', source: 'Kraken' }, { id: 'eth', label: 'ETHEREUM', unit: '$', basis: 'UTC gün açılışına göre', source: 'Kraken' }];
let cache = initial;
let fetched = 0;
let pending: Promise<Quote[]> | undefined;
async function json(url: string) { const r = await fetch(url, { signal: AbortSignal.timeout(10000) }); if (!r.ok)
    throw Error('Veri alınamadı'); return r.json() as Promise<{
    price: number;
    updatedAt: string;
    last: string;
    open: string;
    result: Record<string, {
        c: string[];
        o: string;
    }>;
}>; }
const valid = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
const pct = (n: number, p: number) => (n / p - 1) * 100;
async function load(force = false) { if (pending)
    return pending; if (!force && Date.now() - fetched < 55000)
    return cache; pending = (async () => { const from = new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10); const result = await Promise.allSettled([json('https://api.frankfurter.dev/v2/providers/ecb/rates?base=EUR&quotes=USD,TRY&from=' + from), json('https://api.gold-api.com/price/XAU'), json('https://api.kraken.com/0/public/Ticker?pair=XBTUSD,ETHUSD')]); let rows = cache.map(q => ({ ...q, stale: true })); if (result[0].status === 'fulfilled' && Array.isArray(result[0].value)) {
    const rates = result[0].value as {
        date: string;
        quote: string;
        rate: number;
    }[];
    const dates = [...new Set(rates.map(q => q.date))].sort().reverse();
    const get = (d: string, q: string) => rates.find(x => x.date === d && x.quote === q)?.rate;
    const eur = get(dates[0], 'TRY'), usdDen = get(dates[0], 'USD'), peur = get(dates[1], 'TRY'), pusdDen = get(dates[1], 'USD');
    if (valid(eur) && valid(usdDen)) {
        const usd = eur / usdDen;
        rows[0] = { ...rows[0], value: usd, change: valid(peur) && valid(pusdDen) ? pct(usd, peur / pusdDen) : undefined, asOf: dates[0], stale: false };
        rows[1] = { ...rows[1], value: eur, change: valid(peur) ? pct(eur, peur) : undefined, asOf: dates[0], stale: false };
    }
} if (result[1].status === 'fulfilled' && valid(result[1].value.price) && valid(rows[0].value) && !rows[0].stale) {
    const v = result[1].value;
    const value = v.price * rows[0].value / 31.1034768;
    rows[2] = { ...rows[2], value, change: valid(cache[2].value) ? pct(value, cache[2].value) : undefined, asOf: v.updatedAt || new Date().toISOString(), stale: false };
} for (const [idx, key] of [[3, 'XXBTZUSD'], [4, 'XETHZUSD']] as const) {
    const r = result[2];
    if (r.status === 'fulfilled') {
        const v = Number(r.value.result?.[key]?.c?.[0]), open = Number(r.value.result?.[key]?.o);
        if (valid(v) && valid(open))
            rows[idx] = { ...rows[idx], value: v, change: pct(v, open), asOf: new Date().toISOString(), stale: false };
    }
} await Promise.all(rows.slice(3).map(async (q, j) => { if (!q.stale)
    return; try {
    const v = await json('https://api.gold-api.com/price/' + (j === 0 ? 'BTC' : 'ETH'));
    if (valid(v.price)) {
        const old = cache[j + 3];
        rows[j + 3] = { ...q, value: v.price, change: old.source === 'Gold API' && valid(old.value) ? pct(v.price, old.value) : undefined, source: 'Gold API', basis: 'önceki yenilemeye göre', asOf: v.updatedAt || new Date().toISOString(), stale: false };
    }
}
catch { } })); cache = rows; fetched = Date.now(); return rows; })().finally(() => { pending = undefined; }); return pending; }
function useMarkets() { const [quotes, setQuotes] = useState(initial); const [loading, setLoading] = useState(true); useEffect(() => { let mounted = true; const tick = () => { load().then(q => { if (mounted) {
    setQuotes(q);
    setLoading(false);
} }).catch(() => { if (mounted)
    setLoading(false); }); }; tick(); const id = setInterval(() => { if (!document.hidden)
    tick(); }, 60000); return () => { mounted = false; clearInterval(id); }; }, []); return { quotes, loading, refresh: async () => { setLoading(true); try {
        setQuotes(await load(true));
    }
    finally {
        setLoading(false);
    } } }; }
const price = (q: Quote) => q.value === undefined ? '—' : q.unit + ' ' + q.value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const movement = (q: Quote) => q.change === undefined ? '—' : (q.change > 0 ? '↑ +' : q.change < 0 ? '↓ ' : '→ ') + q.change.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
const color = (q: Quote) => q.change === undefined || q.change === 0 ? 'market-neutral' : q.change > 0 ? 'market-up' : 'market-down';
const when = (q: Quote) => q.asOf ? new Date(q.asOf.length === 10 ? q.asOf + 'T12:00:00Z' : q.asOf).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', year: 'numeric', ...(q.asOf.length > 10 ? { hour: '2-digit' as const, minute: '2-digit' as const } : {}) }) : 'Veri bekleniyor';
export function MarketTicker() { const { quotes, loading } = useMarkets(); return <div className="market-strip"><div className="container market-inner"><Link className="market-heading" href="/piyasalar"><TrendingUp size={14}/> PİYASALAR</Link>{quotes.map(q => <Link href={'/piyasalar#' + q.id} className="market-item" key={q.id} title={`${q.source} · ${when(q)} · ${q.basis}${q.stale ? ' · Son alınan veri' : ''}`}><b>{q.label}</b><span>{loading && !q.value ? '…' : price(q)}</span><em className={color(q)}>{movement(q)}</em>{q.stale && <small>{q.value ? 'ESKİ VERİ' : 'VERİ YOK'}</small>}</Link>)}</div></div>; }
export function MarketsPage() { const { quotes, loading, refresh } = useMarkets(); return <><div className="market-detail">{quotes.map(q => <article key={q.id} id={q.id} className="market-card"><h2>{q.label}</h2><strong>{price(q)}</strong><span className={color(q)}>{movement(q)} {q.basis}</span><small>{q.source}<br />{when(q)}{q.stale ? ' · Güncelleme alınamadı' : ''}</small></article>)}</div><button className="red-button market-refresh" disabled={loading} onClick={refresh}><RefreshCw size={15} style={{ display: 'inline', marginRight: 8 }}/>{loading ? 'Güncelleniyor…' : 'Fiyatları yenile'}</button><p className="market-sources">Dövizler günlük ECB referans kurlarıdır. Gram altın, ons altının dolar fiyatı ile son günlük USD/TRY kurundan hesaplanan gösterge değeridir; kuyumcu alış/satış fiyatı değildir. Altının değişimi bu sayfadaki önceki yenilemeyle, Kraken kripto verileri UTC 00.00 gün açılışıyla karşılaştırılır. Kraken erişilemezse Gold API fiyatı kullanılır ve değişim önceki yenilemeye göre gösterilir. Sayfa açıkken 60 saniyede bir yenilenir.</p><p className="market-sources">Kaynaklar: <a href="https://frankfurter.dev/" target="_blank" rel="noopener noreferrer">Frankfurter / ECB</a> · <a href="https://gold-api.com/" target="_blank" rel="noopener noreferrer">Gold API</a> · <a href="https://www.kraken.com/" target="_blank" rel="noopener noreferrer">Kraken</a></p></>; }
