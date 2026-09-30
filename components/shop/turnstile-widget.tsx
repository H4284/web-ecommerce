"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

type TurnstileWidgetProps = {
  onToken: (token: string) => void;
  onExpire?: () => void;
  /** Increment to reset the widget after a failed submit. */
  resetSignal?: number;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const USE_STUB =
  !SITE_KEY || process.env.NEXT_PUBLIC_USE_EMULATORS === "1";

/** Cloudflare Turnstile (explicit render). Stub token in emulators / when the site key is missing. */
export function TurnstileWidget({
  onToken,
  onExpire,
  resetSignal = 0,
}: TurnstileWidgetProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onTokenRef.current = onToken;
    onExpireRef.current = onExpire;
  }, [onToken, onExpire]);

  // Stub before paint so the form token is ready before the user can submit.
  useLayoutEffect(() => {
    if (USE_STUB) {
      onTokenRef.current("dev-turnstile-token");
    }
  }, []);

  useEffect(() => {
    if (USE_STUB) return;
    if (!hostRef.current) return;

    function mount() {
      if (!hostRef.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(hostRef.current, {
        sitekey: SITE_KEY,
        theme: "light",
        callback: (token) => onTokenRef.current(token),
        "expired-callback": () => {
          onTokenRef.current("");
          onExpireRef.current?.();
        },
        "error-callback": () => onTokenRef.current(""),
      });
    }

    if (window.turnstile) {
      mount();
    } else {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-turnstile="1"]',
      );
      if (!existing) {
        const script = document.createElement("script");
        script.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad";
        script.async = true;
        script.dataset.turnstile = "1";
        window.onTurnstileLoad = mount;
        document.head.appendChild(script);
      } else {
        window.onTurnstileLoad = mount;
      }
    }

    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!resetSignal) return;
    if (USE_STUB) {
      onTokenRef.current("dev-turnstile-token");
      return;
    }
    if (widgetId.current && window.turnstile) {
      window.turnstile.reset(widgetId.current);
      onTokenRef.current("");
    }
  }, [resetSignal]);

  if (USE_STUB) {
    return (
      <p className="text-xs text-ink-muted" data-testid="turnstile-dev">
        Turnstile (dev)
      </p>
    );
  }

  return <div ref={hostRef} className="min-h-[65px]" />;
}
