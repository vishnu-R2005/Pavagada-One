"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";

const items=[
  {href:"/customer",label:"Home",icon:"⌂"},
  {href:"/customer/shops",label:"Shops",icon:"▦"},
  {href:"/customer/orders",label:"Orders",icon:"▣"},
  {href:"/customer/account",label:"Profile",icon:"♙"},
];

export function CustomerNav(){
  const path=usePathname();
  return <nav className="fixed bottom-0 left-0 right-0 z-30 mx-auto flex max-w-[480px] border-t border-slate-100 bg-white/95 px-2 backdrop-blur">
    {items.map(item=>{const active=item.href==="/customer"?path==="/customer":path.startsWith(item.href);return <Link key={item.href} href={item.href} className={`grid flex-1 place-items-center gap-1 py-2 text-[10px] font-semibold ${active?"text-[#ff5b12]":"text-slate-400"}`}><span className="text-lg leading-none">{item.icon}</span>{item.label}</Link>})}
  </nav>;
}
