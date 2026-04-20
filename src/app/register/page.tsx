"use client";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Semua field wajib diisi.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mendaftar.");
      }

      router.push("/login?registered=true");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Buat Akun</h1>
          <p className="text-slate-500 font-medium">
            Daftar sekarang untuk mulai bermain.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Full Name"
            placeholder="Ahmad Satria"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
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
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm font-bold text-red-600">
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="full"
            className="mt-2"
            isLoading={isLoading}
          >
            Sign Up
          </Button>
        </form>

        <div className="text-center mt-8 text-sm font-medium text-slate-500">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="text-blue-600 font-bold hover:underline"
          >
            Login di sini
          </Link>
        </div>
      </Card>
    </div>
  );
}
