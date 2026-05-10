import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Badge } from "@/components/ui/Badge";

export function PlatformShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
