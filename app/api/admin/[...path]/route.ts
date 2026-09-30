import { admin, body, bucket, CmsError, database, failure, readState, release, releases, response, save } from '@/lib/cms/server';
export const dynamic = 'force-dynamic';
type Ctx = {
    params: Promise<{
        path: string[];
    }>;
};
export async function GET(request: Request, { params }: Ctx) { try {
    await admin(request);
    const path = (await params).path.join('/');
    const db = database();
    if (path === 'state')
        return response({ ...await readState(), releases: await releases(), publisherConfigured: (await db.prepare('SELECT COUNT(*) AS n FROM cms_releases WHERE published_at IS NOT NULL').first<{
                n: number;
            }>())?.n !== 0 });
    if (path === 'revisions')
        return response({ items: (await db.prepare('SELECT id,revision,created_at,actor,label FROM cms_revisions ORDER BY revision DESC LIMIT 30').all()).results });
    if (path === 'media')
        return response({ items: (await db.prepare('SELECT * FROM cms_media ORDER BY created_at DESC LIMIT 500').all()).results });
    if (path === 'inbox')
        return response({ messages: (await db.prepare('SELECT id,name,email,subject,body,created_at FROM messages ORDER BY created_at DESC LIMIT 100').all()).results, comments: (await db.prepare('SELECT id,article_id,name,body,created_at FROM comments ORDER BY created_at DESC LIMIT 100').all()).results });
    if (path === 'media/file') {
        const id = new URL(request.url).searchParams.get('id') || '';
        if (!/^[a-f0-9-]+\.(png|jpg|webp|gif)$/.test(id))
            throw new CmsError('Görsel bulunamadı.', 404);
        const file = await bucket().get(id);
        if (!file)
            throw new CmsError('Görsel bulunamadı.', 404);
        return new Response(file.body, { headers: { 'Content-Type': file.httpMetadata?.contentType || 'application/octet-stream', 'Cache-Control': 'private, max-age=60', 'X-Content-Type-Options': 'nosniff' } });
    }
    throw new CmsError('Sayfa bulunamadı.', 404);
}
catch (e) {
    return failure(e);
} }
export async function POST(request: Request, { params }: Ctx) { try {
    const user = await admin(request);
    const path = (await params).path.join('/');
    if (path === 'media') {
        if (Number(request.headers.get('content-length') || 0) > 8500000)
            throw new CmsError('Görsel en fazla 8 MB olabilir.', 413);
        const f = await request.formData();
        const file = f.get('file');
        if (!(file instanceof File) || file.size > 8 * 1024 * 1024 || file.size < 12)
            throw new CmsError('8 MB altında bir PNG, JPEG, WebP veya GIF seçin.');
        const bytes = new Uint8Array(await file.arrayBuffer());
        let ext = '', mime = '';
        if (bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71) {
            ext = 'png';
            mime = 'image/png';
        }
        else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
            ext = 'jpg';
            mime = 'image/jpeg';
        }
        else if (new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP') {
            ext = 'webp';
            mime = 'image/webp';
        }
        else if (new TextDecoder().decode(bytes.slice(0, 6)).match(/^GIF8[79]a$/)) {
            ext = 'gif';
            mime = 'image/gif';
        }
        else
            throw new CmsError('Bu dosya desteklenen bir görsel değil.');
        const id = crypto.randomUUID() + '.' + ext, alt = String(f.get('alt') || file.name).slice(0, 300);
        await bucket().put(id, bytes, { httpMetadata: { contentType: mime } });
        try {
            await database().prepare('INSERT INTO cms_media (id,filename,mime,size,alt,created_at) VALUES (?,?,?,?,?,?)').bind(id, file.name.slice(0, 200), mime, file.size, alt, new Date().toISOString()).run();
        }
        catch (e) {
            await bucket().delete(id);
            throw e;
        }
        return response({ id, path: '/uploads/' + id, alt }, 201);
    }
    const data = await body(request);
    if (path === 'state')
        return response(await save(data.state, data.revision, user.displayName, String(data.label || 'İçerik güncellendi')));
    if (path === 'release')
        return response(await release(data.revision), 201);
    if (path === 'restore') {
        const old = await database().prepare('SELECT data FROM cms_revisions WHERE id=?').bind(String(data.id)).first<{
            data: string;
        }>();
        if (!old)
            throw new CmsError('Sürüm bulunamadı.', 404);
        return response(await save(JSON.parse(old.data), data.revision, user.displayName, 'Önceki sürüm geri yüklendi'));
    }
    throw new CmsError('İşlem bulunamadı.', 404);
}
catch (e) {
    return failure(e);
} }
