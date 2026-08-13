import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  const params = await searchParams;
  const next = params.next && params.next.startsWith("/") ? params.next : "/dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-dark via-brand to-emerald-700 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-xl font-bold text-brand shadow-lg">
            AFA
          </div>
          <h1 className="mt-4 text-xl font-semibold text-white">Athaya Football Academy</h1>
          <p className="mt-1 text-sm text-emerald-100">Sign in to your ERP dashboard</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <LoginForm next={next} />
        </div>
        <p className="mt-6 text-center text-xs text-emerald-100">
          Sample logins — Super Admin: owner@athayafootball.com · Password: Athaya@123
        </p>
      </div>
    </div>
  );
}
