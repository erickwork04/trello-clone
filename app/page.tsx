import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-indigo-500 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="size-3.5 text-white"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="3" y="3" width="7" height="18" rx="1.5" fill="currentColor" />
              <rect x="14" y="3" width="7" height="11" rx="1.5" fill="currentColor" />
            </svg>
          </div>
          <span className="font-semibold text-slate-900 tracking-tight">
            Taskboard
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            Olá, <span className="font-medium text-slate-900">{session.user.name}</span>
          </span>
          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-slate-400 text-sm">Seus boards aparecerão aqui.</p>
        </div>
      </main>
    </div>
  );
}
