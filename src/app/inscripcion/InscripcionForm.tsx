"use client";

import { useState } from "react";
import FirmaCanvas from "@/components/FirmaCanvas";

export default function InscripcionForm() {
  const [form, setForm] = useState({
    nombreCompleto: "",
    dni: "",
    fechaNacimiento: "",
    domicilio: "",
    email: "",
    celular: "",
    password: "",
    anioAsociado: "",
    categoriaPrevia: "",
    primerPeriodo: "",
  });
  const [fueSocio, setFueSocio] = useState<null | boolean>(null);
  const [firma, setFirma] = useState<string | null>(null);
  const [acepta, setAcepta] = useState(false);
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (fueSocio === null) {
      setError("Indicá si fuiste socio anteriormente.");
      return;
    }
    if (!firma) {
      setError("Por favor, firmá la solicitud.");
      return;
    }
    if (!acepta) {
      setError("Debés aceptar la declaración jurada.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/inscripcion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        fueSocio,
        firmaDataUrl: firma,
        aceptaDeclaracion: acepta,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "No se pudo enviar la solicitud.");
      return;
    }
    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="card text-center">
        <div className="text-4xl">✅</div>
        <h2 className="mt-2 text-xl font-bold text-tiro-azul">
          ¡Solicitud enviada!
        </h2>
        <p className="mt-2 text-sm text-tiro-grisTexto">
          Recibimos tu solicitud de inscripción. La administración del club la
          revisará y, una vez aprobada, vas a poder ingresar con tu email y
          contraseña.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 1 - Datos personales */}
      <section className="card space-y-4">
        <h2 className="border-b pb-2 text-sm font-bold uppercase tracking-wide text-tiro-azul">
          1 · Datos personales del solicitante
        </h2>
        <div>
          <label className="label">Nombre completo</label>
          <input
            className="input"
            value={form.nombreCompleto}
            onChange={(e) => set("nombreCompleto", e.target.value)}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Documento (DNI)</label>
            <input
              className="input"
              value={form.dni}
              onChange={(e) => set("dni", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Fecha de nacimiento</label>
            <input
              type="date"
              className="input"
              value={form.fechaNacimiento}
              onChange={(e) => set("fechaNacimiento", e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <label className="label">Domicilio real</label>
          <input
            className="input"
            value={form.domicilio}
            onChange={(e) => set("domicilio", e.target.value)}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Correo electrónico</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Celular</label>
            <input
              className="input"
              value={form.celular}
              onChange={(e) => set("celular", e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <label className="label">
            Contraseña (para ingresar al portal luego de la aprobación)
          </label>
          <input
            type="password"
            className="input"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            required
            minLength={6}
            placeholder="Mínimo 6 caracteres"
          />
        </div>
      </section>

      {/* 2 - Vinculación previa */}
      <section className="card space-y-4">
        <h2 className="border-b pb-2 text-sm font-bold uppercase tracking-wide text-tiro-azul">
          2 · Vinculación previa con la asociación
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="fueSocio"
              checked={fueSocio === false}
              onChange={() => setFueSocio(false)}
            />
            <span>Es mi primera vez</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="fueSocio"
              checked={fueSocio === true}
              onChange={() => setFueSocio(true)}
            />
            <span>Ya fui socio anteriormente</span>
          </label>
        </div>

        {fueSocio === true && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Año en que se asoció</label>
              <input
                type="number"
                className="input"
                value={form.anioAsociado}
                onChange={(e) => set("anioAsociado", e.target.value)}
                placeholder="Ej: 2015"
              />
            </div>
            <div>
              <label className="label">Categoría de asociado</label>
              <input
                className="input"
                value={form.categoriaPrevia}
                onChange={(e) => set("categoriaPrevia", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Primer período en que inició pago</label>
              <input
                className="input"
                value={form.primerPeriodo}
                onChange={(e) => set("primerPeriodo", e.target.value)}
                placeholder="Ej: 03/2015"
              />
            </div>
          </div>
        )}
      </section>

      {/* 3 - Declaración y firma */}
      <section className="card space-y-4">
        <h2 className="border-b pb-2 text-sm font-bold uppercase tracking-wide text-tiro-azul">
          3 · Declaración
        </h2>
        <p className="text-sm text-tiro-grisTexto">
          Lo expresado tiene carácter de declaración jurada. Afirmo que los
          datos consignados son verdaderos.
        </p>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={acepta}
            onChange={(e) => setAcepta(e.target.checked)}
          />
          <span>
            Acepto la declaración jurada y confirmo que los datos son correctos.
          </span>
        </label>

        <div>
          <label className="label">Firma</label>
          <FirmaCanvas onChange={setFirma} />
        </div>
      </section>

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? "Enviando..." : "Enviar solicitud de inscripción"}
      </button>
    </form>
  );
}
