"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {CustomerNav} from "@/components/customer-nav";

type Order={id:string;order_no:string;status:string;total_paise:number;created_at:string;shop_name:string;payment_status:string};
const money=(value:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format((Number(value)||0)/100);
const label=(status:string)=>status.replaceAll("_"," ").replace(/\b\w/g,value=>value.toUpperCase());
const tone=(status:string)=>status==="cancelled"?"bg-rose-100 text-rose-700":status==="delivered"?"bg-emerald-100 text-emerald-700":"bg-orange-100 text-orange-700";

export default function Orders(){
  const [orders,setOrders]=useState<Order[]>([]);const [notice,setNotice]=useState("");
  async function load(){const response=await fetch("/api/orders");const data=await response.json().catch(()=>({}));if(response.ok)setOrders(data.orders??[]);else setNotice(data.error||"Unable to load orders.");}
  useEffect(()=>{void load();},[]);
  async function cancel(id:string){const response=await fetch(`/api/orders/${id}/cancel`,{method:"POST"});const data=await response.json().catch(()=>({}));if(!response.ok){setNotice(data.error||"This order cannot be cancelled.");return;}setNotice("Order cancelled.");await load();}
  return <main className="min-h-screen bg-[#fff3e5] text-slate-900 md:p-6"><div className="mx-auto min-h-screen max-w-[480px] bg-[#fffdfa] pb-20 shadow-2xl shadow-orange-950/10 md:min-h-[820px] md:rounded-[2rem]"><header className="flex h-16 items-center justify-between px-5"><Link href="/customer" className="grid h-9 w-9 place-items-center rounded-full text-xl">‹</Link><h1 className="text-sm font-extrabold">My Orders</h1><Link href="/customer/cart" className="text-sm text-[#ff5b12]">🛒</Link></header>{notice&&<button onClick={()=>setNotice("")} className="mx-5 w-[calc(100%-2.5rem)] rounded-xl bg-rose-600 px-3 py-2 text-left text-xs font-semibold text-white">{notice}</button>}<section className="space-y-3 px-5 pt-3">{orders.map(order=><article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100" key={order.id}><Link href={`/customer/orders/${order.id}`}><div className="flex items-start justify-between"><div><p className="text-sm font-extrabold">{order.order_no}</p><p className="mt-1 text-[11px] text-slate-500">{new Date(order.created_at).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${tone(order.status)}`}>{label(order.status)}</span></div><p className="mt-4 text-xs text-slate-600">{order.shop_name}</p><div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-[11px] text-slate-500">{order.status==="delivered"?"Delivered successfully":"Tap to track your order"}</span><b className="text-sm">{money(order.total_paise)}</b></div></Link>{order.status==="placed"&&<button onClick={()=>void cancel(order.id)} className="mt-3 text-xs font-bold text-rose-600">Cancel order</button>}</article>)}{!orders.length&&!notice&&<div className="rounded-2xl bg-white px-5 py-14 text-center shadow-sm"><p className="text-4xl">🛍️</p><p className="mt-3 text-sm font-bold">No orders yet</p><Link href="/customer/shops" className="mt-3 inline-block text-xs font-bold text-[#ff5b12]">Start shopping</Link></div>}</section><CustomerNav/></div></main>;
}
