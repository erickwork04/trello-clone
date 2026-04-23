import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <div className="w-full max-w-md auth-card-enter">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-6">
          <div className="size-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="size-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="3" y="3" width="7" height="18" rx="1.5" fill="currentColor" />
              <rect x="14" y="3" width="7" height="11" rx="1.5" fill="currentColor" />
            </svg>
          </div>
          <span className="text-slate-100 font-semibold text-lg tracking-tight">
            Taskboard
          </span>
        </div>
      </div>

      <Card className="bg-slate-900/80 border border-slate-700/60 shadow-2xl shadow-black/40 backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="text-slate-100 text-2xl font-semibold tracking-tight">
            Criar conta
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm">
            Comece a organizar seus projetos gratuitamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
      </Card>
    </div>
  );
}
