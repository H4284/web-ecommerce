"use client";

import { useEffect, useRef } from "react";

type TurnstileWidgetProps = {
  onToken: (token: string) => void;
  onExpire?: () => void;
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

/** Cloudflare Turnstile (explicit render). Stub token when the site key is missing. */
export function TurnstileWidget({ onToken, onExpire }: TurnstileWidgetProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onTokenRef.current = onToken;
    onExpireRef.current = onExpire;
  }, [onToken, onExpire]);

  useEffect(() => {
    if (!SITE_KEY) {
      onTokenRef.current("dev-turnstile-token");
      return;
    }
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

  if (!SITE_KEY) {
    return (
      <p className="text-xs text-ink-muted" data-testid="turnstile-dev">
        Turnstile (dev)
      </p>
    );
  }

  return <div ref={hostRef} className="min-h-[65px]" />;
}
