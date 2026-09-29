import type { CategoryDoc, CategoryTreeNode } from "@/lib/shop/catalog-queries";

export type CategoryContext = {
  category: CategoryDoc;
  parent: CategoryDoc | null;
  siblings: CategoryDoc[];
  children: CategoryDoc[];
};

/** Resolve parent, siblings and children for chips + breadcrumb. */
export function resolveCategoryContext(
  tree: CategoryTreeNode[],
  category: CategoryDoc,
): CategoryContext {
  for (const root of tree) {
    if (root.id === category.id) {
      return {
        category,
        parent: null,
        siblings: tree,
        children: root.children,
      };
    }
    const child = root.children.find((c) => c.id === category.id);
    if (child) {
      return {
        category,
        parent: root,
        siblings: root.children,
        children: [],
      };
    }
  }
  return { category, parent: null, siblings: [], children: [] };
}

export function categoryChips(ctx: CategoryContext): Array<{ slug: string; name: string }> {
  if (ctx.children.length > 0) {
    return [
      { slug: ctx.category.slug, name: ctx.category.name },
      ...ctx.children.map((c) => ({ slug: c.slug, name: c.name })),
    ];
  }
  if (ctx.parent) {
    return [
      { slug: ctx.parent.slug, name: ctx.parent.name },
      ...ctx.siblings.map((c) => ({ slug: c.slug, name: c.name })),
    ];
  }
  return ctx.siblings.map((c) => ({ slug: c.slug, name: c.name }));
}
