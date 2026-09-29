import { redirect } from "next/navigation";

/** Plan sitemap path — canonical cart is `/cart`. */
export default function ShportaRedirect() {
  redirect("/cart");
}
