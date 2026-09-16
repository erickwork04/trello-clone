import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignInForm } from "@/components/auth/sign-in-form";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md auth-card-enter">
      <div className="mb-8 text-center">

        <div className="mb-6 inline-flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="size-6 text-white"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="3"
                y="3"
                width="7"
                height="18"
                rx="1.5"
                fill="currentColor"
              />
              <rect
                x="14"
                y="3"
                width="7"
                height="11"
                rx="1.5"
                fill="currentColor"
              />
            </svg>
          </div>

          <span className="text-3xl font-semibold tracking-tight text-slate-900">
            Connect Board
          </span>
        </div>

      </div>

      <Card className="border border-slate-200 bg-white shadow-sm">

        <CardHeader className="pb-6 text-center">
          <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
            Bem-vindo de volta
          </CardTitle>

          <CardDescription className="text-sm text-slate-500">
            Entre na sua conta para continuar organizando seu dia.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <SignInForm />
        </CardContent>
      </Card>
    </div>
  );
}