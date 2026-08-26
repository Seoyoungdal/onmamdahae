import {env} from "cloudflare:workers";

export type User={id:string;email:string;name:string;role:"admin"|"leader"|"member"};
const statements=[
 `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY,email TEXT NOT NULL,name TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'member',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
 `CREATE TABLE IF NOT EXISTS services (id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,service_date TEXT NOT NULL,service_time TEXT NOT NULL,location TEXT NOT NULL DEFAULT '본당',leader_id TEXT,leader_name TEXT,playlist_url TEXT NOT NULL DEFAULT '',print_key TEXT,print_name TEXT,created_by TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
 `CREATE TABLE IF NOT EXISTS assignments (id INTEGER PRIMARY KEY AUTOINCREMENT,service_id INTEGER NOT NULL,part TEXT NOT NULL,member_name TEXT NOT NULL,sort_order INTEGER NOT NULL DEFAULT 0)`,
 `CREATE TABLE IF NOT EXISTS songs (id INTEGER PRIMARY KEY AUTOINCREMENT,service_id INTEGER NOT NULL,title TEXT NOT NULL,artist TEXT NOT NULL DEFAULT '',song_key TEXT NOT NULL DEFAULT '',bpm INTEGER NOT NULL DEFAULT 0,reference_url TEXT NOT NULL DEFAULT '',leader_note TEXT NOT NULL DEFAULT '',sort_order INTEGER NOT NULL DEFAULT 0,version INTEGER NOT NULL DEFAULT 1,original_key TEXT NOT NULL,original_name TEXT NOT NULL,annotated_key TEXT,annotated_name TEXT,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`
 ,`CREATE TABLE IF NOT EXISTS service_files (service_id INTEGER NOT NULL,kind TEXT NOT NULL,file_key TEXT NOT NULL,file_name TEXT NOT NULL,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(service_id,kind))`
];
export const bindings=()=>env as unknown as {DB:D1Database;FILES:R2Bucket;ADMIN_PASSWORD?:string;LEADER_PASSWORD?:string};
export async function ready(){const{DB}=bindings();await DB.batch(statements.map(s=>DB.prepare(s)));}
export async function userFrom(request:Request):Promise<User>{
 await ready();const id=request.headers.get("oai-authenticated-user-id");const email=request.headers.get("oai-authenticated-user-email");
 if(!id||!email)throw new Response("로그인이 필요합니다.",{status:401});
 const db=bindings().DB;let user=await db.prepare("SELECT id,email,name,role FROM users WHERE id=?").bind(id).first<User>();
 if(!user){const count=await db.prepare("SELECT COUNT(*) count FROM users").first<{count:number}>();const role=count?.count===0?"admin":"member";await db.prepare("INSERT INTO users(id,email,name,role) VALUES(?,?,?,?)").bind(id,email,email.split("@")[0],role).run();user={id,email,name:email.split("@")[0],role};}
 const serviceCount=await db.prepare("SELECT COUNT(*) count FROM services").first<{count:number}>();
 if(serviceCount?.count===0&&user.role==="admin")await db.batch([
  ["수요예배","2026-08-02","오후 7:30"],["청년예배","2026-08-06","오후 2:00"],["주일 2부예배","2026-08-09","오전 11:00"],["청년예배","2026-08-13","오후 2:00"],["주일 2부예배","2026-08-16","오전 11:00"],["금요기도회","2026-08-20","오후 7:30"],["주일 2부예배","2026-08-23","오전 11:00"],["연합예배","2026-08-30","오전 11:00"]
 ].map(([title,date,time])=>db.prepare("INSERT INTO services(title,service_date,service_time,created_by) VALUES(?,?,?,?)").bind(title,date,time,user!.id)));
 return user;
}
export async function canEditService(user:User,serviceId:number){if(user.role==="admin")return true;if(user.role!=="leader")return false;const s=await bindings().DB.prepare("SELECT leader_id FROM services WHERE id=?").bind(serviceId).first<{leader_id:string|null}>();return !!s&&(s.leader_id===null||s.leader_id===user.id);}
