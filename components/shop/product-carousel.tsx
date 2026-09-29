"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ProductCard, type ProductCardModel } from "@/components/shop/product-card";
import { cn } from "cn";

type ProductCarouselProps = {
  products: ProductCardModel[];
  className?: string;
};

export function ProductCarousel({ products, className }: ProductCarouselProps) {
  return (
    <Carousel
      opts={{ align: "start", dragFree: true }}
      className={cn("w-full px-10", className)}
    >
      <CarouselContent className="-ml-4">
        {products.map((item) => (
          <CarouselItem
            key={item.product.id}
            className="basis-[80%] pl-4 sm:basis-1/2 md:basis-1/3 lg:basis-1/4"
          >
            <ProductCard {...item} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-0 border-border bg-surface" />
      <CarouselNext className="right-0 border-border bg-surface" />
    </Carousel>
  );
}
