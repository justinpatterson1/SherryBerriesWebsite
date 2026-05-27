"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type GalleryImage = {
  id: string;
  imageUrl: string;
  altText: string | null;
};

export function ProductGallery({
  images,
  productName,
  bestseller,
}: {
  images: GalleryImage[];
  productName: string;
  bestseller?: boolean;
}) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState({ on: false, x: 50, y: 50 });
  const stageRef = useRef<HTMLDivElement>(null);

  if (images.length === 0) {
    return (
      <div className="aspect-square w-full rounded-[28px] bg-gradient-to-br from-pink to-pink-deep border border-white/[0.06]" />
    );
  }

  const current = images[active] ?? images[0];

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoom({ on: true, x, y });
  };

  return (
    <div className="flex gap-4 max-[900px]:flex-col-reverse">
      <div
        role="tablist"
        aria-label="Product images"
        className={
          "flex flex-col gap-2.5 max-h-[640px] overflow-y-auto pr-1 " +
          "max-[900px]:flex-row max-[900px]:overflow-x-auto max-[900px]:overflow-y-hidden max-[900px]:pr-0 max-[900px]:pb-1"
        }
      >
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`View image ${i + 1}`}
            onClick={() => setActive(i)}
            className={
              "relative shrink-0 w-[78px] h-[78px] rounded-xl overflow-hidden border " +
              "transition-[border-color,box-shadow,transform] duration-200 cursor-pointer " +
              (i === active
                ? "border-pink shadow-[0_0_0_2px_rgba(255,79,163,0.18),0_0_28px_rgba(255,79,163,0.32)]"
                : "border-white/10 hover:border-blush/60 hover:-translate-y-px")
            }
          >
            <Image
              src={img.imageUrl}
              alt={img.altText ?? `${productName} thumbnail ${i + 1}`}
              fill
              sizes="78px"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      <div
        ref={stageRef}
        onMouseEnter={() => setZoom((z) => ({ ...z, on: true }))}
        onMouseLeave={() => setZoom({ on: false, x: 50, y: 50 })}
        onMouseMove={onMove}
        className={
          "relative flex-1 aspect-square rounded-[28px] overflow-hidden bg-canvas-2 " +
          "border border-white/[0.06] shadow-[0_24px_60px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,79,163,0.08)_inset,0_0_80px_rgba(255,79,163,0.1)_inset]"
        }
      >
        <Image
          key={current.id}
          src={current.imageUrl}
          alt={current.altText ?? productName}
          fill
          priority
          sizes="(max-width: 900px) 100vw, 55vw"
          className="object-cover transition-[transform,opacity] duration-[260ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] animate-[fade-up-light_240ms_ease]"
          style={{
            transform: zoom.on ? "scale(1.6)" : "scale(1)",
            transformOrigin: `${zoom.x}% ${zoom.y}%`,
          }}
        />

        {bestseller && (
          <span className="absolute top-4 left-4 z-[2] py-1.5 px-3 rounded-full bg-gradient-to-br from-pink to-pink-deep text-white font-sans text-[10px] font-bold tracking-[0.16em] uppercase leading-none shadow-[0_6px_14px_rgba(255,79,163,0.35)]">
            Bestseller
          </span>
        )}

        <span
          aria-hidden="true"
          className={
            "absolute bottom-4 right-4 z-[2] py-1.5 px-3 rounded-full bg-white/10 backdrop-blur-[10px] border border-white/15 text-ink font-sans text-[10px] font-medium tracking-[0.16em] uppercase " +
            "transition-opacity duration-200 " +
            (zoom.on ? "opacity-0" : "opacity-100")
          }
        >
          Hover to zoom ✦
        </span>
      </div>
    </div>
  );
}
