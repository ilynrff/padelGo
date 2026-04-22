"use client";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Suspense, useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

function LoginContent() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ main: string; hint?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError({ main: "Email dan password wajib diisi." });
      return;
    }

    setError(null);
    setIsLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setIsLoading(false);
    if (!result || result.error) {
      const rawError = result?.error || "";
      if (rawError.includes("EMAIL_OR_PASSWORD_WRONG")) {
        setError({
          main: "Email atau password salah.",
          hint: "Pastikan akun sudah terdaftar atau periksa kembali email dan password Anda.",
        });
      } else {
        setError({ main: rawError || "Gagal login. Coba lagi." });
      }
      return;
    }

    // Redirect berdasarkan role
    const session = await getSession();
    if (session?.user?.role === "ADMIN") {
      router.push("/admin");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 min-h-[calc(100vh-64px)]">
      <Card className="w-full max-w-md p-8 md:p-10 rounded-[2rem] shadow-xl">
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">
            Selamat datang
          </h1>
          <p className="text-slate-500 font-medium">
            Masukkan email dan password untuk login.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            placeholder="player@padelgo.id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-sm font-bold text-red-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error.main}
              </div>
              {error.hint && (
                <p className="text-xs text-red-500 font-medium pl-6">{error.hint}</p>
              )}
            </div>
          )}

          <Button
            type="submit"
            size="full"
            className="mt-2"
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>

        <div className="text-center mt-8 text-sm font-medium text-slate-500">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="text-blue-600 font-bold hover:underline"
          >
            Daftar gratis
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
