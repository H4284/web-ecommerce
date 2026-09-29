export type NavCategory = {
  href: string;
  label: string;
  children: Array<{ href: string; label: string }>;
};

type CategoryNode = {
  slug: string;
  name: string;
  children: Array<{ slug: string; name: string }>;
};

/** Flat nav links: promote children when there is a single root with children. */
export function categoryNavItems(tree: CategoryNode[]): NavCategory[] {
  if (tree.length === 1 && tree[0].children.length > 0) {
    return tree[0].children.map((child) => ({
      href: `/categories/${child.slug}`,
      label: child.name,
      children: [],
    }));
  }
  return tree.map((root) => ({
    href: `/categories/${root.slug}`,
    label: root.name,
    children: root.children.map((child) => ({
      href: `/categories/${child.slug}`,
      label: child.name,
    })),
  }));
}
