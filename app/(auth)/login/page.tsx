"use client";

import { useActionState } from "react";
import { login, type LoginFormState } from "@/lib/actions/auth";

const initialState: LoginFormState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-light px-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="bg-industrial px-6 py-5">
          <h1 className="text-xl font-bold text-carbon">MOCER SAS</h1>
          <p className="text-sm text-carbon/80">Inspección de equipos de torque</p>
        </div>
        <form action={formAction} className="p-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate mb-1">
              Correo
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full min-h-11 rounded-md border border-neutral-light bg-white px-3 text-base text-carbon focus:outline-none focus:ring-2 focus:ring-industrial"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate mb-1">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full min-h-11 rounded-md border border-neutral-light bg-white px-3 text-base text-carbon focus:outline-none focus:ring-2 focus:ring-industrial"
            />
          </div>
          {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="w-full min-h-11 rounded-md bg-carbon text-white font-semibold hover:bg-carbon/90 disabled:opacity-50"
          >
            {pending ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
