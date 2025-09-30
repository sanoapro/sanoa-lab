"use client";
import Link from "next/link";

export default function EmojiIcon({
  emoji,
  href,
  size = "text-2xl",
  title,
}: { emoji: string; href?: string; size?: string; title?: string }) {
  const node = <span className={`${size} leading-none`} aria-label={title}>{emoji}</span>;
  return href ? <Link href={href} className="inline-flex items-center">{node}</Link> : node;
}
