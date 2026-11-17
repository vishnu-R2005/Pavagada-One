"use client";

import Link from "next/link";
import {useEffect,useState} from "react";

type Notice={id:string;title:string;body:string;created_at:string;read_at?:string|null;type:string};

export default function Notifications(){
  const [notifications,setNotifications]=useState<Notice[]>([]);
  useEffect(()=>{fetch("/api/notifications").then(response=>response.json()).then(data=>setNotifications(data.notifications??[]));void fetch("/api/notifications",{method:"PATCH"});},[]);
  return <main className="min-h-screen bg-[#fff3e5] text-slate-900 md:p-6"><div className="mx-auto min-h-screen max-w-[480px] bg-[#fffdfa] pb-10 shadow-2xl shadow-orange-950/10 md:min-h-[820px] md:rounded-[2rem]"><header className="flex h-16 items-center justify-between px-5"><Link href="/customer" className="grid h-9 w-9 place-items-center rounded-full text-xl">‹</Link><h1 className="text-sm font-extrabold">Notifications</h1><span className="w-9"/></header><section className="space-y-3 px-5 pt-3">{notifications.map(notification=><article key={notification.id} className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-lg text-[#ff5b12]">♧</span><div className="min-w-0 flex-1"><b className="block text-xs">{notification.title}</b><p className="mt-1 text-[11px] leading-4 text-slate-600">{notification.body}</p><small className="mt-2 block text-[10px] text-slate-400">{new Date(notification.created_at).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}</small></div></article>)}{!notifications.length&&<div className="rounded-2xl bg-white px-5 py-14 text-center shadow-sm"><p className="text-4xl">♧</p><p className="mt-3 text-sm font-bold">You’re all caught up</p><p className="mt-1 text-xs text-slate-500">Order updates will appear here.</p></div>}</section></div></main>;
}
