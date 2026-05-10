"use client";

import { type FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCarregando(true);
    setErro("");

    const formData = new FormData(event.currentTarget);

    const result = await signIn("credentials", {
      email: String(formData.get("email")),
      password: String(formData.get("password")),
      redirect: false,
      callbackUrl: searchParams.get("callbackUrl") ?? "/dashboard"
    });

    setCarregando(false);

    if (result?.error) {
      setErro("Credenciais invalidas ou banco ainda nao populado.");
      return;
    }

    router.push(result?.url ?? "/dashboard");
    router.refresh();
  }

  return (
    <form className="grid" onSubmit={entrar}>
      <label className="field">
        <span>Email</span>
        <input className="input" defaultValue="aluno@cbmo.test" name="email" type="email" />
      </label>
      <label className="field">
        <span>Senha</span>
        <input className="input" defaultValue="123456" name="password" type="password" />
      </label>
      {erro ? <small style={{ color: "var(--color-amber-em)" }}>{erro}</small> : null}
      <Button disabled={carregando} type="submit">
        <LogIn size={18} /> {carregando ? "Autenticando" : "Entrar na plataforma"}
      </Button>
    </form>
  );
}
