"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminCopy } from "@/content/admin";
import type { ShopSettings } from "@/lib/shop/settings-schema";
import {
  exportNewsletterCsvAction,
  saveSettingsAction,
} from "@/app/admin/settings/actions";

type SettingsAdminProps = {
  initial: ShopSettings;
};

export function SettingsAdmin({ initial }: SettingsAdminProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function save() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await saveSettingsAction(settings);
      if (!result.ok) {
        setError(adminCopy.settingsSaveFail);
        return;
      }
      setMessage(adminCopy.settingsSaved);
      router.refresh();
    });
  }

  function downloadCsv() {
    startTransition(async () => {
      const result = await exportNewsletterCsvAction();
      if (!result.ok || !result.csv) {
        setError(adminCopy.settingsSaveFail);
        return;
      }
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "newsletter.csv";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  const kosovo = settings.deliveryMethods.find((m) => m.id === "kosovo");

  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <section className="space-y-4">
        <h2 className="font-display text-xl text-ink">{adminCopy.settingsDelivery}</h2>
        {settings.deliveryMethods.map((method, i) => (
          <div
            key={method.id}
            className="grid gap-3 border border-border bg-surface p-4 sm:grid-cols-2"
          >
            <p className="sm:col-span-2 text-sm font-medium text-ink">{method.id}</p>
            <label className="flex flex-col gap-1 text-sm">
              <span>{adminCopy.settingsLabel}</span>
              <input
                value={method.label}
                onChange={(e) => {
                  const next = [...settings.deliveryMethods];
                  next[i] = { ...method, label: e.target.value };
                  setSettings({ ...settings, deliveryMethods: next });
                }}
                className="min-h-11 border border-border px-3"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>{adminCopy.settingsPrice}</span>
              <input
                type="number"
                min={0}
                value={method.priceCents}
                onChange={(e) => {
                  const next = [...settings.deliveryMethods];
                  next[i] = { ...method, priceCents: Number(e.target.value) };
                  setSettings({ ...settings, deliveryMethods: next });
                }}
                className="min-h-11 border border-border px-3"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>{adminCopy.settingsFreeOver}</span>
              <input
                type="number"
                min={0}
                value={method.freeOverCents ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  const next = [...settings.deliveryMethods];
                  next[i] = {
                    ...method,
                    freeOverCents: raw === "" ? null : Number(raw),
                  };
                  setSettings({ ...settings, deliveryMethods: next });
                }}
                className="min-h-11 border border-border px-3"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>{adminCopy.settingsDays}</span>
              <input
                value={method.days}
                onChange={(e) => {
                  const next = [...settings.deliveryMethods];
                  next[i] = { ...method, days: e.target.value };
                  setSettings({ ...settings, deliveryMethods: next });
                }}
                className="min-h-11 border border-border px-3"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={method.active}
                onChange={(e) => {
                  const next = [...settings.deliveryMethods];
                  next[i] = { ...method, active: e.target.checked };
                  setSettings({ ...settings, deliveryMethods: next });
                }}
              />
              {adminCopy.settingsActive}
            </label>
          </div>
        ))}
        {kosovo ? (
          <p className="text-xs text-ink-muted">
            {adminCopy.settingsFreeOver}: {kosovo.freeOverCents ?? "—"}
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-ink">{adminCopy.settingsPayment}</h2>
        <ul className="space-y-2">
          {settings.paymentMethods.map((method, i) => (
            <li
              key={method.id}
              className="flex flex-wrap items-center gap-3 border border-border bg-surface px-4 py-3 text-sm"
            >
              <span className="min-w-[8rem] font-medium">{method.label}</span>
              <span className="text-ink-muted">{method.id}</span>
              <label className="ml-auto flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={method.active}
                  onChange={(e) => {
                    const next = [...settings.paymentMethods];
                    next[i] = { ...method, active: e.target.checked };
                    setSettings({ ...settings, paymentMethods: next });
                  }}
                />
                {adminCopy.settingsActive}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl text-ink">{adminCopy.settingsCompany}</h2>
        <label className="flex flex-col gap-1 text-sm">
          <span>{adminCopy.settingsCompanyName}</span>
          <input
            value={settings.company.name}
            onChange={(e) =>
              setSettings({
                ...settings,
                company: { ...settings.company, name: e.target.value },
              })
            }
            className="min-h-11 border border-border px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>{adminCopy.settingsCompanyEmail}</span>
          <input
            type="email"
            value={settings.company.email}
            onChange={(e) =>
              setSettings({
                ...settings,
                company: { ...settings.company, email: e.target.value },
              })
            }
            className="min-h-11 border border-border px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>{adminCopy.settingsCompanyPhone}</span>
          <input
            value={settings.company.phone}
            onChange={(e) =>
              setSettings({
                ...settings,
                company: { ...settings.company, phone: e.target.value },
              })
            }
            className="min-h-11 border border-border px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>{adminCopy.settingsCompanyAddress}</span>
          <input
            value={settings.company.address}
            onChange={(e) =>
              setSettings({
                ...settings,
                company: { ...settings.company, address: e.target.value },
              })
            }
            className="min-h-11 border border-border px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>{adminCopy.settingsCompanyIban}</span>
          <input
            value={settings.company.iban}
            onChange={(e) =>
              setSettings({
                ...settings,
                company: { ...settings.company, iban: e.target.value },
              })
            }
            className="min-h-11 border border-border px-3"
          />
        </label>
      </section>

      <section className="space-y-3">
        <label className="flex flex-col gap-1 text-sm">
          <span>{adminCopy.settingsOrdersInbox}</span>
          <input
            type="email"
            value={settings.ordersInbox}
            onChange={(e) =>
              setSettings({ ...settings, ordersInbox: e.target.value })
            }
            className="min-h-11 border border-border px-3"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>{adminCopy.settingsOrderPrefix}</span>
          <input
            value={settings.orderPrefix}
            onChange={(e) =>
              setSettings({ ...settings, orderPrefix: e.target.value })
            }
            maxLength={4}
            className="min-h-11 border border-border px-3 uppercase"
          />
        </label>
      </section>

      {message ? (
        <p className="text-sm text-ink-muted" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="min-h-11 bg-ink px-5 text-sm text-surface disabled:opacity-50"
        >
          {pending ? adminCopy.settingsSaving : adminCopy.settingsSave}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={downloadCsv}
          className="min-h-11 border border-border px-5 text-sm disabled:opacity-50"
        >
          {adminCopy.settingsNewsletterCsv}
        </button>
      </div>
    </div>
  );
}
