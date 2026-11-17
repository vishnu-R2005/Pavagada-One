import {createClient} from "@libsql/client";
export const db=process.env.TURSO_DATABASE_URL&&process.env.TURSO_AUTH_TOKEN?createClient({url:process.env.TURSO_DATABASE_URL,authToken:process.env.TURSO_AUTH_TOKEN}):null;
export async function query(sql:string,args:(string|number|null)[]=[]){if(!db)throw new Error("Database is not configured. Add Turso credentials to .env.local.");return db.execute({sql,args});}
export function requireDb(){if(!db)throw new Error("Database is not configured. Add Turso credentials to .env.local.");return db}