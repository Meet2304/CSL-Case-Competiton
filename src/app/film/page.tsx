import type { Metadata } from "next";
import { ProductFilm } from "@/components/film/ProductFilm";

export const metadata: Metadata = {
  title: "Product film",
  description:
    "A movie-style walk through the working Findoe prototype: the family dashboard before a loss, the Bank Advisor on the day, and the family afterwards. All data shown is mock data.",
};

// Open to everyone: src/proxy.ts lets /film through untouched. The app's own pages run inside it.
export default function FilmPage() {
  return <ProductFilm />;
}
