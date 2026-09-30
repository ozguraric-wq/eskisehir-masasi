import {cpSync, mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

// Build a separate static target. The Worker application and its APIs remain intact.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const stage = join(root, '.github-pages-build');
const output = join(root, 'out', 'github-pages');
const basePath = (process.env.PAGES_BASE_PATH || '/eskisehir-masasi').replace(/\/$/, '');
if (!/^\/[a-zA-Z0-9_-]+$/.test(basePath)) throw new Error('PAGES_BASE_PATH must be one repository path.');
const origin = 'https://ozguraric-wq.github.io' + basePath;
const read = path => readFileSync(join(stage, path), 'utf8');
const write = (path, value) => {
  mkdirSync(dirname(join(stage, path)), {recursive: true});
  writeFileSync(join(stage, path), value);
};
const edit = (path, before, after) => {
  const value = read(path);
  if (!value.includes(before)) throw new Error(`Static export adapter needs updating: ${path}`);
  write(path, value.replace(before, after));
};
const asset = value => typeof value === 'string' && value.startsWith('/')
  ? basePath + value : value;

rmSync(stage, {recursive: true, force: true});
mkdirSync(stage, {recursive: true});
for (const path of ['app', 'components/news', 'components/ui', 'data', 'public', 'vendor', 'hooks']) {
  cpSync(join(root, path), join(stage, path), {recursive: true});
}
for (const path of ['app/api', 'app/chatgpt-auth.ts']) {
  rmSync(join(stage, path), {recursive: true, force: true});
}
write('lib/utils.ts', readFileSync(join(root, 'lib/utils.ts'), 'utf8'));
write('lib/paths.ts', `export const sitePath = (path: string) => ${JSON.stringify(basePath)} + path;\n`);
for (const name of ['query-listing', 'query-gallery']) {
  write(`components/news/${name}.tsx`, readFileSync(join(root, `github-pages/${name}.tsx`), 'utf8'));
}
write('package.json', readFileSync(join(root, 'package.json'), 'utf8'));
write('postcss.config.mjs', readFileSync(join(root, 'postcss.config.mjs'), 'utf8'));
write('tsconfig.json', JSON.stringify({
  compilerOptions: {
    target: 'ES2017', lib: ['dom', 'dom.iterable', 'esnext'], strict: true,
    skipLibCheck: true, noEmit: true, esModuleInterop: true, module: 'esnext',
    moduleResolution: 'bundler', resolveJsonModule: true, isolatedModules: true,
    jsx: 'react-jsx', incremental: true, plugins: [{name: 'next'}],
    paths: {'@/*': ['./*']}, types: ['node']
  },
  include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
  exclude: ['node_modules']
}, null, 2));
write('next.config.mjs', `export default ${JSON.stringify({
  output: 'export', basePath, trailingSlash: true,
  images: {unoptimized: true}, experimental: {cpus: 2}
})};\n`);

// Plain image elements and native forms do not receive Next's basePath automatically.
const articles = JSON.parse(read('data/articles.json')).map(article => ({
  ...article, image: asset(article.image), gallery: article.gallery?.map(asset)
}));
write('data/articles.json', JSON.stringify(articles));
write('data/videos.json', JSON.stringify(JSON.parse(read('data/videos.json')).map(video => ({
  ...video, poster: asset(video.poster)
}))));
edit('app/layout.tsx', "icon:'/favicon.svg',shortcut:'/favicon.svg'",
  `icon:'${basePath}/favicon.svg',shortcut:'${basePath}/favicon.svg'`);
write('components/news/chrome.tsx', read('components/news/chrome.tsx')
  .replaceAll('action="/ara"', `action="${basePath}/ara/"`)
  .replaceAll('href="/rss.xml"', `href="${basePath}/rss.xml"`));
write('components/news/listing.tsx', "import {sitePath} from '@/lib/paths';\n" +
  read('components/news/listing.tsx').replace('`${basePath}?', '`${sitePath(basePath)}/?'));

// All known news, category, district and information routes are exported as HTML.
for (const [path, expression] of [
  ['app/haber/[slug]/page.tsx', 'articles.map(article => ({slug: article.slug}))'],
  ['app/kategori/[slug]/page.tsx', 'categories.map(([slug]) => ({slug}))'],
  ['app/ilceler/[slug]/page.tsx', 'districts.map(([slug]) => ({slug}))'],
  ['app/sayfa/[slug]/page.tsx', 'Object.keys(pages).map(slug => ({slug}))']
]) write(path, read(path) + `\nexport const dynamicParams = false;\nexport function generateStaticParams() { return ${expression}; }\n`);

// Query parameters are handled in the browser while route content is pre-rendered.
for (const path of ['app/kategori/[slug]/page.tsx', 'app/ilceler/[slug]/page.tsx', 'app/ilceler/page.tsx']) {
  write(path, read(path)
    .replace("import {Listing} from '@/components/news/listing';", "import {QueryListing as Listing} from '@/components/news/query-listing';")
    .replace('params,searchParams', 'params')
    .replace(';searchParams:Promise<{sayfa?:string}>', '')
    .replace('const q=await searchParams;', '')
    .replace('const {sayfa}=await searchParams;', '')
    .replace(' page={Number(q.sayfa||1)}', '')
    .replace(' page={Number(sayfa||1)}', '')
    .replace('({searchParams}:{searchParams:Promise<{sayfa?:string}>})', '()'));
}
write('app/ara/page.tsx', `import {QueryListing} from '@/components/news/query-listing';
import {newest} from '@/data/news';
export const metadata = {title: 'Haber Ara'};
export default function Page() {
  return <QueryListing search title="Haber ara" description="Şehrin gündeminde aradığınız haberi bulun."
    items={newest()} basePath="/ara"/>;
}\n`);
write('app/foto-galeri/page.tsx', read('app/foto-galeri/page.tsx')
  .replace("import {Gallery} from '@/components/news/media';", "import {QueryGallery as Gallery} from '@/components/news/query-gallery';")
  .replace('async function Page({searchParams}:{searchParams:Promise<{haber?:string}>}){const {haber}=await searchParams;', 'function Page(){')
  .replace(' initialSlug={haber}', ''));

// Next route modules cannot export arbitrary components.
const videosPage = read('app/videolar/page.tsx');
write('components/news/video-collection.tsx', videosPage
  .replace("export const metadata={title:'Videolar'};", '')
  .replace('export default function Page(){return <VideoCollection/>}', ''));
write('app/videolar/page.tsx', `import {VideoCollection} from '@/components/news/video-collection';
export const metadata = {title: 'Videolar'};
export default function Page() { return <VideoCollection/>; }\n`);
edit('app/kategori/[slug]/page.tsx', "@/app/videolar/page", "@/components/news/video-collection");

// The GitHub target uses public, non-secret YouTube IDs from versioned settings.
edit('app/canli-yayin/page.tsx', "import {env} from 'cloudflare:workers';", "import env from '@/data/live.json';");
edit('app/canli-yayin/page.tsx', "export const dynamic='force-dynamic';", '');

// GitHub Pages has no database runtime. Do not expose non-working submission forms.
const engagement = read('components/news/engagement.tsx').split('const reactions=')[0];
write('components/news/engagement.tsx', engagement +
  '\nexport function Engagement(_props: {articleId: string}) { return null; }\n');
write('components/news/contact.tsx', `export function ContactForm(_props: {subject?: string}) {
  return <div className="info-box"><p>Bu yayında mesaj gönderimi henüz açık değil. Yayıncı iletişim bilgileri tamamlandığında bu sayfada duyurulacaktır.</p></div>;
}\n`);
const policies = {
  iletisim: ['Haber önerisi, iş birliği ve yayınlarımızla ilgili görüşleriniz için iletişim kanallarımız bu sayfada duyurulacaktır.'],
  'okur-temsilcisi': ['Haberlerin doğruluğu ve kaynak kullanımıyla ilgili görüşlerinizi iletebileceğiniz iletişim bilgileri bu sayfada duyurulacaktır.'],
  duzeltme: ['Düzeltme veya yanıt talebiniz için haber bağlantısını, ilgili ifadeyi ve doğrulanabilir dayanağınızı hazırlayın. Başvuru iletişim bilgileri bu sayfada duyurulacaktır.'],
  gizlilik: ['Bu yayında yorum, tepki ve iletişim formu üzerinden kişisel veri toplanmaz.', 'Sitede reklam izleme veya analiz kodu yoktur. Videoyu oynattığınızda YouTube veya kaynak kurumun sunucusuna bağlanırsınız; bu hizmetlerin kendi veri politikaları geçerlidir.'],
  'cerez-politikasi': ['Bu yayında yorum ve tepki çerezi kullanılmaz.', 'YouTube videoları oynat düğmesine basılmadan yüklenmez. Bir canlı yayın kanalı bağlandığında yayın oynatıcısı YouTube bağlantısı oluşturabilir.'],
  'yorum-kurallari': ['Bu yayında yorum gönderimi henüz açık değildir.'],
  'yayin-ilkeleri': ['Eskişehir Masası, yerel gelişmeleri açık kaynaklara dayandırır. Kaynak kurum, tarih ve özgün açıklamaya bağlantı haberlerde gösterilir.', 'Eski haberler arşiv olarak belirtilir. Kurum açıklamaları özetlenebilir; iddia, görüş ve olay bilgisi birbirinden ayrılır.']
};
edit('app/sayfa/[slug]/page.tsx', 'export async function generateMetadata',
  `for (const [slug, paragraphs] of Object.entries(${JSON.stringify(policies)})) pages[slug].paragraphs = paragraphs;\nexport async function generateMetadata`);

for (const path of ['app/sitemap.xml/route.ts', 'app/rss.xml/route.ts']) {
  write(path, "export const dynamic = 'force-static';\n" + read(path)
    .replaceAll('https://eskisehir-masasi.ozgurarc.chatgpt.site', origin));
}
write('public/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);

const build = spawnSync(process.execPath, [join(root, 'node_modules/next/dist/bin/next'),
  'build', stage, '--webpack'], {cwd: root, stdio: 'inherit',
  env: {...process.env, NEXT_TELEMETRY_DISABLED: '1'}});
if (build.status !== 0) process.exit(build.status || 1);
rmSync(output, {recursive: true, force: true});
cpSync(join(stage, 'out'), output, {recursive: true});
writeFileSync(join(output, '.nojekyll'), '');
console.log(`GitHub Pages output: ${output}\nPublic URL: ${origin}/`);
