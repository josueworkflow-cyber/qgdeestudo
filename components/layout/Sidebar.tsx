"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, CalendarDays, Gauge, Layers3, MessagesSquare, Trophy, UserRound, BotMessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/conteudo", label: "Conteudo", icon: BookOpen },
  { href: "/simulados", label: "Simulados", icon: Layers3 },
  { href: "/flashcards", label: "Flashcards", icon: Layers3 },
  { href: "/plano-estudos", label: "Plano", icon: CalendarDays },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/forum", label: "Assistente IA", icon: BotMessageSquare },
  { href: "/admin/conteudo", label: "Editor", icon: BookOpen },
  { href: "/perfil", label: "Perfil", icon: UserRound }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <Link className="brand" href="/dashboard">
        <span className="brand-mark">QG</span>
        <span>
          <h1 className="brand-title">QG de Estudo</h1>
          <small className="muted">plataforma operacional</small>
        </span>
      </Link>

      <nav className="nav" aria-label="Navegacao principal">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link key={link.href} className={cn("nav-link", active && "active")} href={link.href}>
              <Icon size={18} aria-hidden />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
