import { ShieldPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function CadastroPage() {
  return (
    <main style={{ display: "grid", minHeight: "100vh", placeItems: "center", padding: 24 }}>
      <section className="card" style={{ width: "min(100%, 480px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <span className="brand-mark">
            <ShieldPlus size={24} />
          </span>
          <span>
            <h1 className="brand-title">Cadastro operacional</h1>
            <small className="muted">liberacao de acesso</small>
          </span>
        </div>

        <div className="grid">
          <label className="field">
            <span>Nome</span>
            <input className="input" name="nome" placeholder="Nome completo" />
          </label>
          <label className="field">
            <span>Email</span>
            <input className="input" name="email" placeholder="email@exemplo.com" type="email" />
          </label>
          <label className="field">
            <span>Senha</span>
            <input className="input" name="senha" type="password" />
          </label>
          <Button type="button">Solicitar acesso</Button>
          <Button href="/login" variant="secondary">
            Ja tenho acesso
          </Button>
        </div>
      </section>
    </main>
  );
}
