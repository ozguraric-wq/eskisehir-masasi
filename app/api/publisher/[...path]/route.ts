// This Site remains owner-private. Dispatch authenticates service callers before this route.
// This route exports only an explicitly queued public snapshot, never drafts or inbox data.
import { body, bucket, CmsError, database, failure, mediaIds, response } from '@/lib/cms/server';
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
    if ((await params).path.join('/') !== 'ack')
        throw new CmsError('Bulunamadı.', 404);
    if (request.headers.get('X-CMS-Publisher') !== 'github-actions')
        throw new CmsError('Yayıncı isteği gerekli.', 403);
    const b = await body(request);
    if (!['published', 'failed'].includes(b.status) || !/^https:\/\/github.com\/ozguraric-wq\/eskisehir-masasi\/actions\/runs\/\d+$/.test(b.runUrl))
        throw new CmsError('Geçersiz yayın sonucu.');
    await database().prepare('UPDATE cms_releases SET status=?,published_at=?,run_url=?,message=? WHERE id=?').bind(b.status, b.status === 'published' ? new Date().toISOString() : null, b.runUrl, String(b.message || '').slice(0, 300), String(b.id)).run();
    return response({ ok: true });
}
catch (e) {
    return failure(e);
} }
