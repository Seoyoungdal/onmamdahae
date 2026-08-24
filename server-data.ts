import {env} from "cloudflare:workers";

export type User={id:string;email:string;name:string;role:"admin"|"leader"|"member"};
const statements=[
 `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY,email TEXT NOT NULL,name TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'member',created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
 `CREATE TABLE IF NOT EXISTS services (id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT NOT NULL,service_date TEXT NOT NULL,service_time TEXT NOT NULL,location TEXT NOT NULL DEFAULT '본당',leader_id TEXT,leader_name TEXT,playlist_url TEXT NOT NULL DEFAULT '',print_key TEXT,print_name TEXT,created_by TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
 `CREATE TABLE IF NOT EXISTS assignments (id INTEGER PRIMARY KEY AUTOINCREMENT,service_id INTEGER NOT NULL,part TEXT NOT NULL,member_name TEXT NOT NULL,sort_order INTEGER NOT NULL DEFAULT 0)`,
 `CREATE TABLE IF NOT EXISTS songs (id INTEGER PRIMARY KEY AUTOINCREMENT,service_id INTEGER NOT NULL,title TEXT NOT NULL,artist TEXT NOT NULL DEFAULT '',song_key TEXT NOT NULL DEFAULT '',bpm INTEGER NOT NULL DEFAULT 0,reference_url TEXT NOT NULL DEFAULT '',leader_note TEXT NOT NULL DEFAULT '',sort_order INTEGER NOT NULL DEFAULT 0,version INTEGER NOT NULL DEFAULT 1,original_key TEXT NOT NULL,original_name TEXT NOT NULL,annotated_key TEXT,annotated_name TEXT,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`
];
export const bindings=()=>env as unknown as {DB:D1Database;FILES:R2Bucket;ADMIN_PASSWORD?:string;LEADER_PASSWORD?:string;SESSION_SECRET?:string};
export async function ready(){const{DB}=bindings();await DB.batch(statements.map(s=>DB.prepare(s)));}
const bytes=(value:string)=>new TextEncoder().encode(value);
async function signature(value:string){const secret=bindings().SESSION_SECRET;if(!secret)return"";const key=await crypto.subtle.importKey("raw",bytes(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]),signed=await crypto.subtle.sign("HMAC",key,bytes(value));return Array.from(new Uint8Array(signed),b=>b.toString(16).padStart(2,"0")).join("")}
export async function roleCookie(role:"admin"|"leader"){const value=`${role}.${Date.now()+1000*60*60*24*30}`,sig=await signature(value);return `om_role=${value}.${sig}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`}
async function roleFrom(request:Request){const raw=request.headers.get("cookie")?.match(/(?:^|;\s*)om_role=([^;]+)/)?.[1];if(!raw)return"member" as const;const [role,expires,sig]=raw.split("."),value=`${role}.${expires}`;if(!(["admin","leader"] as string[]).includes(role)||Number(expires)<Date.now()||sig!==await signature(value))return"member" as const;return role as "admin"|"leader"}
export async function userFrom(request:Request):Promise<User>{
 await ready();const role=await roleFrom(request),user:User={id:role==="member"?"public-member":"shared-editor",email:"",name:role==="admin"?"관리자":role==="leader"?"인도자":"팀원",role};
 const db=bindings().DB;
 const serviceCount=await db.prepare("SELECT COUNT(*) count FROM services").first<{count:number}>();
 if(serviceCount?.count===0&&user.role==="admin")await db.batch([
  ["수요예배","2026-08-02","오후 7:30"],["청년예배","2026-08-06","오후 2:00"],["주일 2부예배","2026-08-09","오전 11:00"],["청년예배","2026-08-13","오후 2:00"],["주일 2부예배","2026-08-16","오전 11:00"],["금요기도회","2026-08-20","오후 7:30"],["주일 2부예배","2026-08-23","오전 11:00"],["연합예배","2026-08-30","오전 11:00"]
 ].map(([title,date,time])=>db.prepare("INSERT INTO services(title,service_date,service_time,created_by) VALUES(?,?,?,?)").bind(title,date,time,user!.id)));
 return user;
}
export async function canEditService(user:User,serviceId:number){if(user.role==="admin")return true;if(user.role!=="leader")return false;const s=await bindings().DB.prepare("SELECT leader_id FROM services WHERE id=?").bind(serviceId).first<{leader_id:string|null}>();return !!s&&(s.leader_id===null||s.leader_id===user.id);}
