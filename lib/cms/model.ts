import { z } from 'zod';
import { articles, categories, districts } from '@/data/news';
import { pages } from '@/data/pages';
import settings from '@/data/settings.json';
import live from '@/data/live.json';
import videos from '@/data/videos.json';
const slug = z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const text = z.string().max(15000);
const safeUrl = z.string().max(2000).refine(v => !v || /^https:\/\//.test(v), 'HTTPS bağlantısı kullanın.');
const image = z.string().max(2000).refine(v => !v || /^\/(?:news|uploads)\/[a-zA-Z0-9._-]+$/.test(v) || /^https:\/\//.test(v), 'Görsel kitaplığını veya HTTPS adresini kullanın.');
export const articleSchema = z.object({ id: slug, slug, title: z.string().min(1).max(220), summary: z.string().max(600), body: z.array(text).max(100), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => !Number.isNaN(Date.parse(v))), source: z.string().max(150), sourceUrl: safeUrl, image, imageCredit: z.string().max(300).optional(), gallery: z.array(image).max(30).optional(), categories: z.array(slug).min(1).max(15), district: z.string().max(60), featured: z.boolean().optional(), videoId: z.string().max(20).optional(), isArchive: z.boolean().optional(), kind: z.string().max(60).optional(), seoTitle: z.string().max(160).optional(), seoDescription: z.string().max(320).optional(), status: z.enum(['published', 'draft', 'trash']) });
export const stateSchema = z.object({ articles: z.array(articleSchema).max(2000), categories: z.array(z.tuple([slug, z.string().min(1).max(60)])).min(1).max(80), pages: z.record(slug, z.object({ title: z.string().min(1).max(160), paragraphs: z.array(text).max(50) })), settings: z.object({ siteTitle: z.string().min(1).max(80), contactEmail: z.union([z.literal(''), z.string().email()]), headlineIds: z.array(slug).max(30), homeSections: z.array(z.object({ title: z.string().min(1).max(80), category: slug })).max(12) }), live: z.object({ YOUTUBE_LIVE_VIDEO_ID: z.string().regex(/^(?:[\w-]{11})?$/), YOUTUBE_CHANNEL_ID: z.string().regex(/^(?:UC[\w-]{22})?$/) }), videos: z.array(z.object({ slug, title: z.string().min(1).max(200), publisher: z.string().max(150), source_url: safeUrl, video_url: safeUrl.optional(), poster: image.optional(), youtube_id: z.string().regex(/^[\w-]{11}$/).optional(), description: z.string().max(1000).optional(), date: z.string().max(30).nullish() }).passthrough()).max(100) });
export type CmsState = z.infer<typeof stateSchema>;
export type CmsArticle = z.infer<typeof articleSchema>;
export const initialState = () => ({ articles: articles.map(a => ({ ...a, status: 'published' as const })), categories: categories as [
        string,
        string
    ][], pages, settings, live, videos } as CmsState);
export function validateState(value: unknown): CmsState { const s = stateSchema.parse(value); for (const key of ['id', 'slug'] as const) {
    if (new Set(s.articles.map(a => a[key])).size !== s.articles.length)
        throw Error('Haber kimliği ve bağlantısı benzersiz olmalı.');
} if (new Set(s.categories.map(c => c[0])).size !== s.categories.length)
    throw Error('Kategori bağlantıları benzersiz olmalı.'); const cats = new Set(s.categories.map(c => c[0])); for (const a of s.articles) {
    if (!a.categories.every(c => cats.has(c)))
        throw Error('Haberlerde kullanılan kategori silinemez.');
    if (!['eskisehir', ...districts.map(d => d[0])].includes(a.district))
        throw Error('Geçerli bir ilçe seçin.');
    if (a.status === 'published' && (!a.summary.trim() || !a.body.some(p => p.trim()) || !a.image))
        throw Error('Yayımlanacak haberin özeti, metni ve kapak görseli olmalı.');
} if (s.settings.homeSections.some(h => !cats.has(h.category)))
    throw Error('Ana sayfa bölümü için geçerli kategori seçin.'); for (const v of s.videos) {
    if (!v.youtube_id && !v.video_url)
        throw Error('Her video için YouTube kimliği veya video bağlantısı girin.');
} return s; }
export function publicSnapshot(s: CmsState) { return { ...s, articles: s.articles.filter(a => a.status === 'published').map(({ status, ...a }) => a), videos: s.videos.map(v => ({ ...v, source_url: v.source_url || v.video_url || (v.youtube_id ? 'https://www.youtube.com/watch?v=' + v.youtube_id : '') })) }; }
