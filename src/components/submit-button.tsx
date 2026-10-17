"use client";
import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";
import { Button } from "./ui";

export function SubmitButton({ children, pendingText = "Сохраняю…", ...rest }: ComponentProps<typeof Button> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...rest}>
      {pending ? pendingText : children}
    </Button>
  );
}
