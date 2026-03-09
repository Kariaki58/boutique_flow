"use client";

import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

export function ProductImageCarousel({
  images,
  className,
  imageClassName,
}: {
  images: string[];
  className?: string;
  imageClassName?: string;
}) {
  const safe = images?.filter(Boolean) ?? [];
  const resolved =
    safe.length > 0 ? safe : ["https://picsum.photos/seed/product/600/800"];

  return (
    <div className={cn("relative", className)}>
      <Carousel opts={{ loop: resolved.length > 1 }}>
        <CarouselContent className="-ml-0">
          {resolved.map((src, idx) => (
            <CarouselItem key={`${src}-${idx}`} className="pl-0">
              <div className="aspect-[3/4] bg-muted w-full overflow-hidden">
                <img
                  src={src}
                  alt={`Product image ${idx + 1}`}
                  className={cn("w-full h-full object-cover", imageClassName)}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {resolved.length > 1 && (
          <>
            <CarouselPrevious className="left-3 top-1/2 -translate-y-1/2" />
            <CarouselNext className="right-3 top-1/2 -translate-y-1/2" />
          </>
        )}
      </Carousel>
    </div>
  );
}


