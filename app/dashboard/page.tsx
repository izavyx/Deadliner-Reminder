import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Task } from "@/lib/types";
import { logout } from "@/app/login/actions";
import { SubmitButton, btnSecondary } from "@/components/ui";
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
    <div className="min-h-full bg-zinc-50/60 dark:bg-zinc-950">
      {/* Header Dashboard */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-sm"
            >
              D
            </Link>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                Dashboard Deadliner
              </h1>
              <p className="text-xs text-zinc-500">
                Halo,{" "}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {displayName}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden text-xs font-medium text-zinc-500 hover:text-indigo-600 sm:inline"
            >
              Beranda
            </Link>
            <form action={logout}>
              <SubmitButton pendingText="Keluar..." className={btnSecondary}>
                Keluar
              </SubmitButton>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
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
