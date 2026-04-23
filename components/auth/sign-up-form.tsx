"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { signUpSchema, type SignUpSchema } from "@/lib/validators/auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function SignUpForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: SignUpSchema) {
    setIsPending(true);
    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });
    setIsPending(false);

    if (error) {
      toast.error(error.message ?? "Erro ao criar conta.");
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
          name="name"
          render={({ field }) => (
            <FormItem className="auth-field-1">
              <FormLabel className="text-slate-300 text-sm font-medium">
                Nome
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Seu nome"
                  autoComplete="name"
                  className="bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-red-400 text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="auth-field-2">
              <FormLabel className="text-slate-300 text-sm font-medium">
                E-mail
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  className="bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-red-400 text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="auth-field-3">
              <FormLabel className="text-slate-300 text-sm font-medium">
                Senha
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-red-400 text-xs" />
            </FormItem>
          )}
        />

        <div className="auth-field-4 pt-1">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all duration-200"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Criar conta"
            )}
          </Button>
        </div>

        <p className="text-center text-sm text-slate-500">
          Já tem uma conta?{" "}
          <Link
            href="/login"
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Entrar
          </Link>
        </p>
      </form>
    </Form>
  );
}
