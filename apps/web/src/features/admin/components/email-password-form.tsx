import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/shared/lib/auth-client";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type Mode = "sign-in" | "sign-up";

/**
 * Email and password sign-in and sign-up, offered only while the server has
 * it on (local development: `AUTH_DEV_EMAIL_PASSWORD`).
 */
export const EmailPasswordForm = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      const { error } =
        mode === "sign-up"
          ? await authClient.signUp.email({ name, email, password })
          : await authClient.signIn.email({ email, password });
      if (error) {
        throw new Error(error.message ?? error.statusText);
      }
    },
    onSuccess: () => navigate({ to: "/admin" }),
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return (
    <form
      className="flex flex-col gap-3 border-t pt-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit.mutate();
      }}
    >
      <p className="text-muted-foreground text-sm">
        Local development: email and password.
      </p>
      {mode === "sign-up" ? (
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <Button type="submit" variant="outline" disabled={submit.isPending}>
        {mode === "sign-up" ? "Sign up" : "Sign in"}
      </Button>
      <Button
        type="button"
        variant="link"
        onClick={() => setMode(mode === "sign-up" ? "sign-in" : "sign-up")}
      >
        {mode === "sign-up"
          ? "Have an account? Sign in"
          : "Need an account? Sign up"}
      </Button>
    </form>
  );
};
