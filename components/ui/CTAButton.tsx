"use client";
import { ButtonHTMLAttributes } from "react";

export default function CTAButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", children, ...rest } = props;
  return (
    <button
      {...rest}
      className={`px-3 py-2 rounded bg-black text-white hover:opacity-90 active:opacity-80 transition ${className}`}
    >
      {children}
    </button>
  );
}
