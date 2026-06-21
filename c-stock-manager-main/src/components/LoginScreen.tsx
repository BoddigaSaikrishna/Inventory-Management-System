import { useState } from "react";
import { Package, Lock, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginScreenProps {
  onLogin: (username: string, password: string) => boolean;
}

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    const ok = onLogin(username, password);
    if (!ok) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError(`Invalid credentials. ${3 - newAttempts} attempt(s) remaining.`);
      if (newAttempts >= 3) {
        setError("Account locked. Refresh to try again.");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 animate-pulse-glow">
            <Package className="h-7 w-7 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Inventory<span className="text-gradient-brand">Pro</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Management System v1.0
            </p>
          </div>
        </div>

        {/* Login card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-lg" style={{ boxShadow: "var(--shadow-glow)" }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm text-muted-foreground">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="pl-10 bg-muted border-border"
                  disabled={attempts >= 3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 bg-muted border-border"
                  disabled={attempts >= 3}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={attempts >= 3}
            >
              Sign In
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Default: <span className="font-mono text-foreground/70">admin</span> / <span className="font-mono text-foreground/70">admin123</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
