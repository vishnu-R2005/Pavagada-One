import {createHmac, randomBytes, scryptSync, timingSafeEqual} from "crypto";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {query} from "@/lib/db";
export type Role="customer"|"merchant"|"admin"|"rider";
export type User={id:string;email:string;fullName:string;role:Role;isActive:boolean};
const COOKIE="pavagada_session";
function secret(){const value=process.env.AUTH_SECRET;if(!value||value.length<32)throw new Error("Set a 32+ character AUTH_SECRET in .env.local.");return value}
export function hashPassword(password:string){const salt=randomBytes(16).toString("hex");return `${salt}:${scryptSync(password,salt,64).toString("hex")}`}
export function verifyPassword(password:string,stored:string){const[salt,hash]=stored.split(":");if(!salt||!hash)return false;return timingSafeEqual(Buffer.from(hash,"hex"),scryptSync(password,salt,64))}
function encode(data:object){const body=Buffer.from(JSON.stringify(data)).toString("base64url");const sig=createHmac("sha256",secret()).update(body).digest("base64url");return `${body}.${sig}`}
function decode(value:string){const[body,sig]=value.split(".");if(!body||!sig)return null;const expected=createHmac("sha256",secret()).update(body).digest("base64url");if(!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return null;try{const d=JSON.parse(Buffer.from(body,"base64url").toString()) as {id:string;role:Role;exp:number};return d.exp>Date.now()?d:null}catch{return null}}
export async function setSession(user:User){const jar=await cookies();jar.set(COOKIE,encode({id:user.id,role:user.role,exp:Date.now()+1000*60*60*24*7}),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*24*7})}
export async function clearSession(){(await cookies()).delete(COOKIE)}
export async function currentUser():Promise<User|null>{const token=(await cookies()).get(COOKIE)?.value;if(!token)return null;const s=decode(token);if(!s)return null;const r=await query("select id,email,full_name,role,is_active from users where id=?",[s.id]);const u=r.rows[0] as Record<string,unknown>|undefined;if(!u||!u.is_active)return null;return{id:String(u.id),email:String(u.email),fullName:String(u.full_name),role:u.role as Role,isActive:Boolean(u.is_active)}}
export async function requireRole(...roles:Role[]){const user=await currentUser();if(!user)redirect("/sign-in");if(!roles.includes(user.role))redirect(`/${user.role}`);return user}
export async function audit(actor:string,action:string,type:string,id?:string){await query("insert into audit_logs (id,actor_id,action,entity_type,entity_id) values (?,?,?,?,?)",[crypto.randomUUID(),actor,action,type,id??null])}