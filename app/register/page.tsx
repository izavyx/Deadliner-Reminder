import Link from "next/link";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <Link href="/" className="text-sm text-zinc-500 hover:text-indigo-600">
        ← Kembali ke beranda
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Buat akun</h1>
      <p className="mt-1 text-zinc-500">Daftar gratis dan mulai catat deadline kuliahmu.</p>

      <RegisterForm />

      <p className="mt-6 text-center text-sm text-zinc-500">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:underline">
          Masuk
        </Link>
      </p>
    </main>
  );
}
