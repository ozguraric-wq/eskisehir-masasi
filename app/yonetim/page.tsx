import {requireChatGPTUser} from '@/app/chatgpt-auth';
import {admin,CmsError} from '@/lib/cms/server';
import {AdminPanel} from '@/components/admin/panel';
export const dynamic='force-dynamic';
export const metadata={title:'Yayın yönetimi',robots:{index:false,follow:false}};
export default async function Page(){await requireChatGPTUser('/yonetim');try{const user=await admin();return <AdminPanel user={user.displayName}/>}catch(e){return <main id="icerik" className="container page-content"><h1>Yönetim erişimi</h1><p>{e instanceof CmsError?e.message:'Yönetim paneline ulaşılamıyor.'}</p></main>}}
