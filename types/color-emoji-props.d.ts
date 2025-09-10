declare module "@/components/ColorEmoji" {
  // Abrimos el modo para no pelear con el runtime actual
  export type EmojiMode = "mono" | "duo" | "flat" | "native" | (string & {});

  export type Props = {
    emoji?: string;          // <- clave para Navbar/Toast/Emoji
    size?: number;
    mode?: EmojiMode;
    color?: string;
    accentColor?: string;
    className?: string;
    title?: string;

    // Campos que ya vi en tu archivo
    token?: string;
    toneA?: string;
    toneB?: string;
  };

  const ColorEmoji: (props: Props) => JSX.Element;
  export default ColorEmoji;
}
