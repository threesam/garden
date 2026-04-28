import NextLink from "next/link";
import type { ComponentProps, ReactNode } from "react";

export const linkClasses =
  "border-b-2 border-[var(--coin)] pb-1 hover:pb-0.5 motion-safe:hover:animate-[link-glitch_2s_ease-in-out_infinite] transition-[padding-bottom] duration-300";

interface LinkProps extends Omit<ComponentProps<typeof NextLink>, "children" | "className"> {
  children: ReactNode;
  external?: boolean;
}

export function Link({ children, external, href, ...props }: LinkProps) {
  if (external) {
    return (
      <a
        href={typeof href === "string" ? href : ""}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClasses}
      >
        {children}
      </a>
    );
  }
  return (
    <NextLink {...props} href={href} className={linkClasses}>
      {children}
    </NextLink>
  );
}
