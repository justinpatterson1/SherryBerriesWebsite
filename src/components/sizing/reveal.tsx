import type { ReactNode } from "react";

// Applies the site's fade-up entrance as a pure-CSS mount animation. Content is
// always rendered visible (the animation ends at opacity 1 via its `both` fill),
// so nothing is ever hidden from no-JS, print, or search crawlers. Honors
// prefers-reduced-motion via the global guard in globals.css.
export function Reveal({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
}) {
  return <Tag className={"animate-fade-up" + (className ? " " + className : "")}>{children}</Tag>;
}
