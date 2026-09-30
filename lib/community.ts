import {env} from 'cloudflare:workers';
import {articles} from '@/data/news';
export function database(){if(!env.DB)throw new Error('DB unavailable');return env.DB;}
export function validArticle(id:unknown){return typeof id==='string'&&articles.some(a=>a.id===id);}
export function visitor(request:Request){const value=request.headers.get('cookie')?.match(/(?:^|;\s*)em_visitor=([a-f0-9-]{36})(?:;|$)/)?.[1];return value||crypto.randomUUID();}
export function response(data:unknown,id:string,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','Set-Cookie':`em_visitor=${id}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=31536000`}});}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');return !!origin&&origin===new URL(request.url).origin;}
export async function counts(articleId:string,visitorId:string){const db=database();const all=await db.prepare('SELECT kind,COUNT(*) AS total FROM reactions WHERE article_id = ? GROUP BY kind').bind(articleId).all<{kind:string;total:number}>();const chosen=await db.prepare('SELECT kind FROM reactions WHERE article_id = ? AND visitor_id = ?').bind(articleId,visitorId).first<{kind:string}>();return {counts:Object.fromEntries(all.results.map(r=>[r.kind,r.total])),selected:chosen?.kind||''};}
