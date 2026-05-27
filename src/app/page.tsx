import { Hero } from "@/components/home/hero";
import { Categories } from "@/components/home/categories";
import { Bestsellers } from "@/components/home/bestsellers";
import { BrandStory } from "@/components/home/brand-story";
import { Faq } from "@/components/home/faq";
import { Newsletter } from "@/components/home/newsletter";

export default function Home() {
  return (
    <main>
      <Hero />
      <Categories />
      <Bestsellers />
      <BrandStory />
      <Faq />
      <Newsletter />
    </main>
  );
}
