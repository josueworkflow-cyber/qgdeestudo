import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main style={{ display: "grid", minHeight: "100vh", placeItems: "center", padding: 24 }}>
      <section className="card" style={{ width: "min(100%, 440px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <span className="brand-mark">
            <ShieldCheck size={24} />
          </span>
          <span>
            <h1 className="brand-title">Acesso CB Sargento</h1>
            <small className="muted">credenciais de estudo</small>
          </span>
        </div>

        <Suspense fallback={<small className="muted">Preparando acesso...</small>}>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
