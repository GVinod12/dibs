"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/admin/actions";

export function LoginForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <h1 className="font-[family-name:var(--font-anton)] text-5xl text-[var(--color-ink)]">
        OWNER
        <br />
        ONLY
      </h1>
      <p className="mt-2 font-[family-name:var(--font-instrument-serif)] text-lg italic normal-case text-[var(--color-fog)]">
        Everyone else — go call dibs on something.
      </p>

      {!configured ? (
        <p className="mt-6 border-2 border-[var(--color-tomato)] bg-white p-3 text-sm text-[var(--color-ink)]">
          Set <code className="font-[family-name:var(--font-space-grotesk)]">DIBS_ADMIN_PASSWORD</code> in{" "}
          <code>.env.local</code> to unlock the dashboard.
        </p>
      ) : (
        <form action={action} className="mt-6 space-y-3">
          <input
            type="password"
            name="password"
            required
            autoFocus
            placeholder="password"
            className="w-full border-2 border-[var(--color-ink)] bg-white px-3 py-3 font-[family-name:var(--font-space-grotesk)] text-sm"
          />
          {state.error ? (
            <p className="text-sm font-semibold text-[var(--color-tomato)]">{state.error}</p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-[var(--color-ink)] px-4 py-3 font-[family-name:var(--font-anton)] text-xl uppercase text-[var(--color-acid)] disabled:opacity-60"
          >
            {pending ? "…" : "let me in →"}
          </button>
        </form>
      )}
    </div>
  );
}
