declare module "@/components/Emoji" {
  import * as React from "react";

  export type Props = {
    emoji?: string;
    size?: number;
    mode?: string;
    color?: string;
    accentColor?: string;
    className?: string;
    title?: string;
  };

  const Emoji: React.FC<Props>;
  export default Emoji;
}
