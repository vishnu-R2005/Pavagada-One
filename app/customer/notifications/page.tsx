"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { CustomerHeader, CustomerNav } from "@/components/customer-nav";
import { apiFetch } from "@/lib/client-session";
import { formatUtcDateTime } from "@/lib/customer-ui";

type Notice = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read_at?: string | null;
  type: string;
};

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notice[]>([]);

  useEffect(() => {
    apiFetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : { notifications: [] }))
      .then((data) => setNotifications(data.notifications ?? []));
    void apiFetch("/api/notifications", { method: "PATCH" }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-stone-900 pb-24 md:pb-12">
      <CustomerHeader title="Notifications" backHref="/customer" />

      <main className="mx-auto max-w-3xl px-4 pt-4 md:px-8 md:pt-8">
        <div className="hidden md:block">
          <h1 className="font-display text-2xl font-bold text-stone-900">
            Notifications
          </h1>
          <p className="mt-0.5 text-xs text-stone-500">
            Live updates on your orders and Pavagada deliveries
          </p>
        </div>

        <section className="mt-4 space-y-3 md:mt-6">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className="flex gap-3.5 rounded-2xl border border-stone-200 bg-white p-4 shadow-xs"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#FFF3EE] text-[#FF5A1F] shrink-0">
                <Bell className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <b className="block text-sm font-bold text-stone-900">
                  {notification.title}
                </b>
                <p className="mt-1 text-xs leading-relaxed text-stone-600">
                  {notification.body}
                </p>
                <small className="mt-2 block text-[11px] text-stone-400">
                  {formatUtcDateTime(notification.created_at)}
                </small>
              </div>
            </article>
          ))}
          {!notifications.length && (
            <div className="rounded-2xl border border-stone-200 bg-white px-6 py-14 text-center shadow-xs">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#FFF3EE] text-[#FF5A1F]">
                <Bell className="h-7 w-7" />
              </div>
              <p className="mt-3 text-base font-bold text-stone-900">
                You’re all caught up
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Order status updates will appear here automatically.
              </p>
            </div>
          )}
        </section>
      </main>

      <CustomerNav />
    </div>
  );
}
