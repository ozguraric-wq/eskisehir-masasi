import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { initialState, validateState, type CmsState, publicSnapshot } from './model';
export class CmsError extends Error {
    constructor(message: string, public status = 400) { super(message); }
}
export function database() { if (!env.DB)
    throw new CmsError('Veritabanına ulaşılamıyor. Lütfen yeniden deneyin.', 503); return env.DB; }
export function bucket() { if (!env.BUCKET)
    throw new CmsError('Görsel deposuna ulaşılamıyor.', 503); return env.BUCKET; }
export async function admin(request?: Request) { const user = await getChatGPTUser(); const owner = (env as unknown as Record<string, string>).CMS_ADMIN_EMAIL; if (!user || !owner || user.email.toLowerCase() !== owner.toLowerCase())
    throw new CmsError('Bu alan yalnızca yayın yöneticisine açıktır.', 403); if (request && request.method !== 'GET' && request.headers.get('origin') !== new URL(request.url).origin)
    throw new CmsError('İşlemi yönetim panelinden başlatın.', 403); return user; }
export function response(data: unknown, status = 200) { return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } }); }
export function failure(e: unknown) { if (e instanceof CmsError)
    return response({ error: e.message }, e.status); if (e instanceof Error && e.name === 'ZodError')
    return response({ error: 'Alanları kontrol edin. Geçersiz veya çok uzun bir değer var.' }, 400); console.error('CMS operation failed', e instanceof Error ? e.message : 'unknown'); return response({ error: 'İşlem tamamlanamadı. Girdileriniz korunuyor; lütfen yeniden deneyin.' }, 500); }
export async function readState() { const row = await database().prepare('SELECT revision,data,updated_at FROM cms_state WHERE id=?').bind('main').first<{
    revision: number;
    data: string;
    updated_at: string;
}>(); return row ? { revision: row.revision, state: JSON.parse(row.data) as CmsState, updatedAt: row.updated_at } : { revision: 0, state: initialState(), updatedAt: null }; }
export async function body(request: Request) { if (Number(request.headers.get('content-length') || 0) > 2500000)
    throw new CmsError('İçerik sınırı aşıldı.', 413); const t = await request.text(); if (t.length > 2500000)
    throw new CmsError('İçerik sınırı aşıldı.', 413); try {
    return JSON.parse(t);
}
catch {
    throw new CmsError('Geçersiz istek.');
} }
export async function save(value: unknown, revision: number, actor: string, label: string) { if (!Number.isInteger(revision) || revision < 0)
    throw new CmsError('Geçersiz sürüm.'); let state: CmsState; try {
    state = validateState(value);
}
catch (e) {
    throw new CmsError(e instanceof Error && e.name !== 'ZodError' ? e.message : 'Haber ve ayar alanlarını kontrol edin.');
} const db = database(), time = new Date().toISOString(), data = JSON.stringify(state), id = crypto.randomUUID(); const results = await db.batch([db.prepare('INSERT OR IGNORE INTO cms_state (id,revision,data,updated_at,actor) VALUES (?,0,?,?,?)').bind('main', JSON.stringify(initialState()), time, actor), db.prepare('UPDATE cms_state SET revision=?,data=?,updated_at=?,actor=? WHERE id=? AND revision=?').bind(revision + 1, data, time, actor, 'main', revision), db.prepare('INSERT INTO cms_revisions (id,revision,data,created_at,actor,label) SELECT ?,revision,data,updated_at,actor,? FROM cms_state WHERE id=? AND revision=? AND updated_at=?').bind(id, label.slice(0, 160), 'main', revision + 1, time)]); if (!results[1].meta.changes)
    throw new CmsError('Başka bir oturum değişiklik kaydetti. Yedek indirip sayfayı yenileyin; kayıtlarınızın üzerine yazılmadı.', 409); return { revision: revision + 1, updatedAt: time, state }; }
export async function release(revision: number) { const current = await readState(); if (current.revision !== revision)
    throw new CmsError('Önce değişiklikleri kaydedin ve güncel sürümü yükleyin.', 409); const state = validateState(current.state); const data = JSON.stringify(publicSnapshot(state)), id = crypto.randomUUID(); const latest = await database().prepare('SELECT id,data FROM cms_releases ORDER BY created_at DESC LIMIT 1').first<{
    id: string;
    data: string;
}>(); if (latest?.data === data)
    return { id: latest.id, duplicate: true }; await database().prepare('INSERT INTO cms_releases (id,revision,data,created_at,status) VALUES (?,?,?,?,?)').bind(id, revision, data, new Date().toISOString(), 'queued').run(); return { id, duplicate: false }; }
export async function releases() { return (await database().prepare('SELECT id,revision,created_at,status,published_at,run_url,message FROM cms_releases ORDER BY created_at DESC LIMIT 15').all()).results; }
export const mediaIds = (snapshot: unknown) => [...new Set((JSON.stringify(snapshot).match(/\/uploads\/[a-f0-9-]+\.(?:png|jpg|webp|gif)/g) || []).map(x => x.slice('/uploads/'.length)))];
