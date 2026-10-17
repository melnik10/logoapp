import { Logo } from "@/components/shell";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 px-4 py-10">
      <div className="mb-8"><Logo /></div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
