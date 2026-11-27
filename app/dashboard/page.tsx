import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Task } from "@/lib/types";
import { logout } from "@/app/login/actions";
import { BrandLogo } from "@/components/site-header";
import { SubmitButton } from "@/components/ui";
import { TaskManager } from "./task-manager";

const ATTACHMENT_BUCKET = "task-attachments";

function getServerTimestamp() {
  return Date.now();
}

export default async function DashboardPage() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const serverNow = getServerTimestamp();

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("is_done", { ascending: true })
    .order("deadline", { ascending: true });

  const rawTasks = (data ?? []) as Task[];

  // Buat signed URL secara batch untuk seluruh lampiran tugas milik user
  const allPaths: string[] = [];
  for (const t of rawTasks) {
    if (Array.isArray(t.attachments)) {
      for (const att of t.attachments) {
        if (att?.path) allPaths.push(att.path);
      }
    }
  }

  const signedMap = new Map<string, string>();
  if (allPaths.length > 0) {
    const { data: signedList } = await supabase.storage
      .from(ATTACHMENT_BUCKET)
      .createSignedUrls(allPaths, 60 * 60 * 12);
    for (const item of signedList ?? []) {
      if (item.path && item.signedUrl) {
        signedMap.set(item.path, item.signedUrl);
      }
    }
  }

  const tasks: Task[] = rawTasks.map((t) => ({
    ...t,
    attachments: Array.isArray(t.attachments)
      ? t.attachments.map((att) => ({
          ...att,
          signed_url: signedMap.get(att.path) ?? att.signed_url,
        }))
      : [],
  }));

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ?? user.email;

  return (
    <div className="min-h-full">
      {/* Header Dashboard Simpel & Minimalis */}
      <header className="sticky top-0 z-30 bg-[#f6f8fb]/85 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200/85 py-4">
            <div className="flex items-center gap-7">
              <BrandLogo href="/dashboard" />
              <nav
                aria-label="Navigasi Dashboard"
                className="hidden items-center gap-5 text-xs font-semibold tracking-wider text-slate-500 uppercase sm:flex"
              >
                <Link href="/" className="transition hover:text-[#2563eb]">
                  Beranda
                </Link>
                <span className="text-[#2563eb]">Ruang Tugas</span>
              </nav>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="hidden max-w-48 items-center gap-2 truncate rounded-full border border-slate-200/90 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 sm:inline-flex">
                <span className="h-2 w-2 shrink-0 rounded-full bg-[#84cc16]" />
                <span className="truncate">{displayName}</span>
              </span>
              <form action={logout}>
                <SubmitButton
                  pendingText="Keluar..."
                  className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
                >
                  Keluar
                </SubmitButton>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Gagal mengambil data: {error.message}. Pastikan{" "}
            <code>supabase/schema.sql</code>, <code>supabase/auth.sql</code>, dan{" "}
            <code>supabase/attachments.sql</code> sudah dijalankan di Supabase SQL Editor.
          </div>
        )}

        <TaskManager tasks={tasks} serverNow={serverNow} userId={user.id} />
      </main>
    </div>
  );
}
