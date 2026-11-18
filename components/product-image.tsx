"use client";

import { ChangeEvent, useState } from "react";
import {
  Camera,
  Droplets,
  Leaf,
  Milk,
  Package,
  ShoppingBag,
  Sparkles,
  Utensils,
  Wheat,
} from "lucide-react";

function CategoryGlyph({
  name,
  className = "h-7 w-7 text-[#0F5132]",
}: {
  name: string;
  className?: string;
}) {
  const value = name.toLowerCase();
  if (value.includes("milk") || value.includes("dairy"))
    return <Milk className={className} />;
  if (value.includes("oil")) return <Droplets className={className} />;
  if (value.includes("atta") || value.includes("flour") || value.includes("wheat"))
    return <Wheat className={className} />;
  if (
    value.includes("fruit") ||
    value.includes("veget") ||
    value.includes("tomato") ||
    value.includes("fresh")
  )
    return <Leaf className={className} />;
  if (value.includes("soap") || value.includes("clean") || value.includes("home"))
    return <Sparkles className={className} />;
  if (value.includes("noodle") || value.includes("snack"))
    return <Utensils className={className} />;
  if (value.includes("grocery")) return <Package className={className} />;
  return <ShoppingBag className={className} />;
}

function inferLocalProductImage(name: string): string | null {
  const value = name.toLowerCase();
  if (value.includes("milk") || value.includes("nandini") || value.includes("dairy")) {
    return "/images/product-milk.jpg";
  }
  if (value.includes("tomato")) {
    return "/images/product-tomatoes.jpg";
  }
  if (value.includes("atta") || value.includes("wheat") || value.includes("flour")) {
    return "/images/product-atta.jpg";
  }
  return null;
}

export function ProductImage({
  src,
  name,
  className,
  fallbackClassName,
}: {
  src?: string | null;
  name: string;
  className: string;
  fallbackClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = src || inferLocalProductImage(name);

  if (resolvedSrc && !failed) {
    return (
      <img
        alt={name}
        src={resolvedSrc}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={className}
      />
    );
  }
  return (
    <div
      aria-label={name}
      className={`${className} overflow-hidden grid place-items-center bg-gradient-to-br from-[#FFF6EE] to-[#F3ECE1] border border-stone-200/70 ${fallbackClassName ?? ""}`}
    >
      <span className="grid h-[76%] w-[76%] max-h-12 max-w-12 place-items-center rounded-xl bg-white/90 shadow-xs">
        <CategoryGlyph
          name={name}
          className="h-[60%] w-[60%] max-h-6 max-w-6 text-[#FF5A1F]"
        />
      </span>
    </div>
  );
}

export function ProductImagePicker({
  initialValue = "",
}: {
  initialValue?: string | null;
}) {
  const [value, setValue] = useState(initialValue ?? "");
  const [message, setMessage] = useState("");

  function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(png|jpeg|webp)$/)) {
      setMessage("Choose a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > 450_000) {
      setMessage("Choose an image smaller than 450 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setValue(String(reader.result ?? ""));
      setMessage("Product image ready to save.");
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-2.5">
      <input type="hidden" name="imageUrl" value={value} />
      {value ? (
        <ProductImage
          src={value}
          name="Product preview"
          className="h-36 w-full rounded-2xl object-cover border border-stone-200"
        />
      ) : (
        <div className="grid h-36 place-items-center rounded-2xl border border-dashed border-stone-300 bg-[#F8FAFC] text-stone-500">
          <div className="flex flex-col items-center gap-1.5 text-xs font-medium">
            <Camera className="h-7 w-7 text-stone-400" />
            <span>Add Product Image</span>
          </div>
        </div>
      )}
      <label className="flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#FF5A1F]/40 bg-[#FFF8F5] px-4 py-2 text-xs font-bold text-[#FF5A1F] hover:bg-[#FFF3EE] transition-colors">
        <Camera className="h-4 w-4" />
        <span>Upload Product Photo</span>
        <input
          onChange={choose}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
        />
      </label>
      <input
        value={value.startsWith("data:image/") ? "" : value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Or paste an image URL (/images/... or https://...)"
        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-xs outline-none focus:border-[#FF5A1F]"
      />
      {message && <p className="text-xs text-stone-500">{message}</p>}
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            setMessage("Image removed. Save to apply.");
          }}
          className="text-xs font-semibold text-rose-600 hover:underline"
        >
          Remove image
        </button>
      )}
    </div>
  );
}
