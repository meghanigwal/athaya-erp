"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";
import { Button, Field, FormMessage, Input } from "@/components/ui";

const initialState: LoginState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <FormMessage message={state.error} />
      <Field label="Email address" htmlFor="email" required>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@athayafootball.com" required />
      </Field>
      <Field label="Password" htmlFor="password" required>
        <Input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
      </Field>
      <Button type="submit" className="mt-2 w-full" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
