"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Zap, Mail, Lock, Loader2, AlertCircle, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30">
              <Zap className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl font-extrabold text-foreground tracking-tighter mb-2">
            AttendEX
          </h1>
          <p className="text-muted-foreground font-medium">
            Attendance Intelligence Platform
          </p>
          <Badge variant="outline" className="mt-3 border-primary/30 text-primary font-black text-[9px] tracking-widest rounded-full px-4 bg-primary/5">
            SYSTEM v2.0
          </Badge>
        </div>

        {/* Login Card */}
        <Card className="rounded-[3rem] border-muted shadow-2xl shadow-black/10 bg-background/80 backdrop-blur-xl overflow-hidden">
          <CardHeader className="p-10 pb-6">
            <CardTitle className="text-2xl font-black tracking-tight">
              System Access
            </CardTitle>
            <CardDescription className="font-bold text-muted-foreground text-xs uppercase tracking-[0.2em] mt-1">
              Identity verification required
            </CardDescription>
          </CardHeader>

          <CardContent className="px-10 pb-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">
                  <Mail className="w-4 h-4 text-primary" />
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-14 rounded-xl border-muted bg-muted/20 font-bold px-5 focus:border-primary text-base"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">
                  <Lock className="w-4 h-4 text-primary" />
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-14 rounded-xl border-muted bg-muted/20 font-bold px-5 focus:border-primary text-base"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <Alert variant="destructive" className="rounded-2xl border-destructive/30 bg-destructive/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-bold">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-16 rounded-2xl font-black text-sm uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 mt-2 transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 mr-3" />
                    Access System
                  </>
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-8 p-5 rounded-2xl bg-muted/30 border border-muted">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">
                Demo Credentials
              </p>
              <div className="space-y-2 font-mono text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                  <span>augustin.mbx@gmail.com / bradley2k19</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                  <span>info@metabox.mu / 123456</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                  <span>oowais@gmail.com / qwerty</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground font-bold mt-8 uppercase tracking-widest opacity-50">
          © 2026 AttendEX · All Rights Reserved
        </p>
      </div>
    </div>
  );
}
