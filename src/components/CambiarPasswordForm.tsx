"use client";

import { useState } from "react";

export default function CambiarPasswordForm() {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOk(false);
    setLoading(true);

    const res = await fetch("/api/perfil/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actual, nueva, repetir }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "No se pudo cambiar la contraseña");
      return;
    }

    setOk(true);
    setActual("");
    setNueva("");
    setRepetir("");
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {ok && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Tu contraseña se cambió correctamente.
        </div>
      )}

      <div>
        <label className="label" htmlFor="actual">
          Contraseña actual
        </label>
        <input
          id="actual"
          type="password"
          className="input"
          value={actual}
          onChange={(e) => setActual(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      <div>
        <label className="label" htmlFor="nueva">
          Nueva contraseña
        </label>
        <input
          id="nueva"
          type="password"
          className="input"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="Mínimo 6 caracteres"
        />
      </div>

      <div>
        <label className="label" htmlFor="repetir">
          Repetir nueva contraseña
        </label>
        <input
          id="repetir"
          type="password"
          className="input"
          value={repetir}
          onChange={(e) => setRepetir(e.target.value)}
          required
          autoComplete="new-password"
        />
      </div>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}
