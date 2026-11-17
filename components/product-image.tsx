"use client";

import {ChangeEvent,useState} from "react";

function iconFor(name:string){
  const value=name.toLowerCase();
  if(value.includes("milk")||value.includes("dairy"))return "🥛";
  if(value.includes("oil"))return "🫗";
  if(value.includes("salt")||value.includes("masala"))return "🧂";
  if(value.includes("atta")||value.includes("flour"))return "🌾";
  if(value.includes("fruit")||value.includes("veget")||value.includes("tomato"))return "🥬";
  if(value.includes("soap")||value.includes("clean"))return "🧼";
  if(value.includes("noodle")||value.includes("maggi"))return "🍜";
  return "🛍️";
}

export function ProductImage({src,name,className,fallbackClassName}:{src?:string|null;name:string;className:string;fallbackClassName?:string}){
  const [failed,setFailed]=useState(false);
  if(src&&!failed)return <img alt={name} src={src} onError={()=>setFailed(true)} className={className}/>;
  return <div aria-label={name} className={`${className} grid place-items-center bg-gradient-to-br from-orange-50 to-amber-100 text-2xl ${fallbackClassName??""}`}>{iconFor(name)}</div>;
}

export function ProductImagePicker({initialValue=""}:{initialValue?:string|null}){
  const [value,setValue]=useState(initialValue??"");
  const [message,setMessage]=useState("");
  function choose(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];
    if(!file)return;
    if(!file.type.match(/^image\/(png|jpeg|webp)$/)){setMessage("Choose a PNG, JPEG, or WebP image.");return;}
    if(file.size>450_000){setMessage("Choose an image smaller than 450 KB.");return;}
    const reader=new FileReader();
    reader.onload=()=>{setValue(String(reader.result??""));setMessage("Product image ready to save.");};
    reader.readAsDataURL(file);
  }
  return <div className="space-y-2"><input type="hidden" name="imageUrl" value={value}/>{value?<ProductImage src={value} name="Product preview" className="h-28 w-full rounded-xl object-cover"/>:<div className="grid h-28 place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-3xl">📷</div>}<label className="block cursor-pointer rounded-xl border border-[#ff5b12] px-3 py-2 text-center text-xs font-bold text-[#ff5b12]">Choose Product Photo<input onChange={choose} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"/></label><input value={value.startsWith("data:image/")?"":value} onChange={event=>setValue(event.target.value)} placeholder="Or paste an image URL" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-[#ff5b12]"/>{message&&<p className="text-[10px] text-slate-500">{message}</p>}{value&&<button type="button" onClick={()=>{setValue("");setMessage("Image removed. Save to apply.");}} className="text-[10px] font-bold text-rose-600">Remove image</button>}</div>;
}
