import { ProductCard, type ProductCardModel } from "@/components/shop/product-card";
import { cn } from "cn";

type ProductGridProps = {
  products: ProductCardModel[];
  className?: string;
};

export function ProductGrid({ products, className }: ProductGridProps) {
  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4",
        className,
      )}
    >
      {products.map((item) => (
        <li key={item.product.id}>
          <ProductCard {...item} />
        </li>
      ))}
    </ul>
  );
}
