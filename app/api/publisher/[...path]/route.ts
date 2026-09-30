// This Site remains owner-private. Dispatch authenticates service callers before this route.
// This route exports queued public snapshots, never drafts or inbox data.
// A fresh installation can queue only the public content already shipped in source.
import { body, bucket, CmsError, database, failure, mediaIds, response } from '@/lib/cms/server';
import { initialState, publicSnapshot, validateState } from '@/lib/cms/model';
export const dynamic = 'force-dynamic';
type Ctx = {
    params: Promise<{
        path: string[];
    }>;
};
export async function GET(request: Request, { params }: Ctx) { try {
    const path = (await params).path.join('/');
    if (path === 'latest') {
        const row = await database().prepare('SELECT id,revision,data,status,created_at FROM cms_releases ORDER BY created_at DESC LIMIT 1').first<{
            id: string;
            revision: number;
            data: string;
            status: string;
            created_at: string;
        }>();
        if (!row)
            return response({ release: null });
        const snapshot = JSON.parse(row.data);
        return response({ release: { id: row.id, revision: row.revision, status: row.status, createdAt: row.created_at, snapshot, media: mediaIds(snapshot) } });
    }
    if (path === 'media') {
        const url = new URL(request.url), id = url.searchParams.get('id') || '', rid = url.searchParams.get('release') || '';
        const row = await database().prepare('SELECT data FROM cms_releases WHERE id=?').bind(rid).first<{
            data: string;
        }>();
        if (!row || !mediaIds(JSON.parse(row.data)).includes(id))
            throw new CmsError('Görsel bu yayında yer almıyor.', 404);
        const object = await bucket().get(id);
        if (!object)
            throw new CmsError('Görsel bulunamadı.', 404);
        return new Response(object.body, { headers: { 'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream', 'Cache-Control': 'private, no-store' } });
    }
    throw new CmsError('Bulunamadı.', 404);
}
catch (e) {
    return failure(e);
} }
export async function POST(request: Request, { params }: Ctx) { try {
    if (request.headers.get('X-CMS-Publisher') !== 'github-actions')
        throw new CmsError('Yayıncı isteği gerekli.', 403);
    const path = (await params).path.join('/');
    if (path === 'bootstrap') {
        // Never accept caller-supplied content or overwrite an editor's saved state.
        // D1 serializes this batch, including concurrent first-run requests.
        const state = validateState(initialState()), data = JSON.stringify(state);
        const snapshot = JSON.stringify(publicSnapshot(state));
        const time = new Date().toISOString(), id = crypto.randomUUID(), db = database();
        const results = await db.batch([
            db.prepare('INSERT INTO cms_state (id,revision,data,updated_at,actor) SELECT ?,0,?,?,? WHERE NOT EXISTS (SELECT 1 FROM cms_state WHERE id=?) AND NOT EXISTS (SELECT 1 FROM cms_releases)').bind('main', data, time, 'source-bootstrap', 'main'),
            db.prepare('INSERT INTO cms_releases (id,revision,data,created_at,status) SELECT ?,0,?,?,? FROM cms_state WHERE id=? AND revision=0 AND actor=? AND data=? AND NOT EXISTS (SELECT 1 FROM cms_releases)').bind(id, snapshot, time, 'queued', 'main', 'source-bootstrap', data)
        ]);
        return response({ bootstrapped: Boolean(results[1].meta.changes) });
    }
    if (path !== 'ack')
        throw new CmsError('Bulunamadı.', 404);
    const b = await body(request);
    if (!['published', 'failed'].includes(b.status) || !/^https:\/\/github.com\/ozguraric-wq\/eskisehir-masasi\/actions\/runs\/\d+$/.test(b.runUrl))
        throw new CmsError('Geçersiz yayın sonucu.');
    await database().prepare('UPDATE cms_releases SET status=?,published_at=?,run_url=?,message=? WHERE id=?').bind(b.status, b.status === 'published' ? new Date().toISOString() : null, b.runUrl, String(b.message || '').slice(0, 300), String(b.id)).run();
    return response({ ok: true });
}
catch (e) {
    return failure(e);
} }
