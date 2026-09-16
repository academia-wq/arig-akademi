import { AppFooter } from "@/components/app-footer";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-paper">
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-[460px] rounded-2xl bg-white p-8 shadow-[0px_8px_12px_rgba(72,83,83,0.07)] sm:p-12">
          <div className="mb-7">
            <h1 className="font-display text-[28px] leading-9 text-ink">{title}</h1>
            <p className="mt-2 text-sm text-ink/50">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
