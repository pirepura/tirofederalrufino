"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import Escudo from "@/components/Escudo";
import { CLUB } from "@/config/club";

type NavLink = { href: string; label: string };

export default function Header({
  nombre,
  rol,
  links = [],
}: {
  nombre: string;
  rol: string;
  links?: NavLink[];
}) {
  return (
    <header className="bg-tiro-azul text-white shadow-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white p-1 shadow-sm">
            <Escudo size={40} />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold uppercase tracking-wide">
              {CLUB.nombre}
            </p>
            <p className="text-xs text-tiro-celesteClaro">
              {rol === "ADMIN" ? "Panel de administración" : "Portal del socio"}
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-tiro-celesteClaro sm:inline">
            {nombre}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium transition hover:bg-white/20"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
