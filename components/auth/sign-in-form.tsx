"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { signInSchema, type SignInSchema } from "@/lib/validators/auth";
import { Button } from "@/components/ui/button";
import { WaitlistDialog } from "@/components/auth/waitlist-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function SignInForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: SignInSchema) {
    setIsPending(true);

    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });

    setIsPending(false);

    if (error) {
      toast.error(error.message ?? "Erro ao fazer login.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="auth-field-1">
              <FormLabel className="text-sm font-medium text-slate-700">
                E-mail
              </FormLabel>

              <FormControl>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  className="
                    h-11
                    border-slate-200
                    bg-white
                    text-slate-900
                    placeholder:text-slate-400
                    focus-visible:border-blue-500
                    focus-visible:ring-blue-500/20
                  "
                  {...field}
                />
              </FormControl>

              <FormMessage className="text-xs text-red-500" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="auth-field-2">
              <FormLabel className="text-sm font-medium text-slate-700">
                Senha
              </FormLabel>

              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="
        h-11
        border-slate-200
        bg-white
        pr-11
        text-slate-900
        placeholder:text-slate-400
        focus-visible:border-blue-500
        focus-visible:ring-blue-500/20
      "
                    {...field}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                      cursor-pointer
                      text-slate-400
                      transition-colors
                      hover:text-slate-700
                    "
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? (
                      <EyeOff className="size-5" />
                    ) : (
                      <Eye className="size-5" />
                    )}
                  </button>
                </div>
              </FormControl>

              <FormMessage className="text-xs text-red-500" />
            </FormItem>
          )}
        />

        <div className="auth-field-3 pt-1">
          <Button
            type="submit"
            disabled={isPending}
            className="
              h-11
              w-full
              cursor-pointer
              bg-blue-600
              font-medium
              text-white
              transition-colors
              hover:bg-blue-700
            "
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Entrar"
            )}
          </Button>
        </div>

        <p className="auth-field-4 text-center text-sm text-slate-500">
          Não tem uma conta?{" "}
          <WaitlistDialog />
        </p>
      </form>
    </Form>
  );
}