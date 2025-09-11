import Image from "next/image";
import clsx from "clsx";
import { getEmoji } from "@/config/emojiTheme";

type Props = {
  token?: string;
  emoji?: string;
  size?: number;
  title?: string;
  className?: string;
  // Props extra que quizá uses en otros sitios; se ignoran aquí sin romper tipos
  mode?: string;
  color?: string;
  accentColor?: string;
};

export default function ColorEmoji({ token, emoji, size = 18, title, className }: Props) {
  const value = emoji ?? getEmoji(token);
  if (typeof value === "string" && value.startsWith("svg:")) {
    const src = value.slice(4);
    return (
      <Image
        src={src}
        alt={title ?? token ?? "icono"}
        width={size}
        height={size}
        className={clsx("inline-block align-[-2px]", className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      title={title}
      className={clsx("inline-block align-[-2px]", className)}
      style={{ fontSize: size, lineHeight: `${size}px` }}
    >
      {value || "❓"}
    </span>
  );
}
