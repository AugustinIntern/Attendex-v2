"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Mail, Lock, Loader2, AlertCircle, ShieldCheck } from "lucide-react";

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
          <div className="flex justify-center mb-10">
            <div className="w-96 flex items-center justify-center group">
              <img src="/AttendEx_Logo.svg" alt="AttendEX Logo" className="w-full h-auto object-contain" />
            </div>
          </div>
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

          <CardContent className="px-10 pb-12">
            <form onSubmit={handleSubmit} className="space-y-8">
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


          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground font-bold mt-8 uppercase tracking-widest opacity-50">
          © 2026 AttendEX · All Rights Reserved
        </p>
      </div>
    </div>
  );
}
