declare module "@/components/ColorEmoji" {
  import * as React from "react";

  export type EmojiMode = "mono" | "duo" | "flat" | "native" | (string & {});

  export type Props = {
    emoji?: string;
    token?: string;
    size?: number;
    mode?: EmojiMode;
    color?: string;
    accentColor?: string;
    className?: string;
    title?: string;
    toneA?: string;
    toneB?: string;
  };

  const ColorEmoji: (props: Props) => React.ReactElement | null;
  export default ColorEmoji;
}
