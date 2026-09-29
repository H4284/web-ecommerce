"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import {
  Controller,
  useForm,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { shopCopy } from "@/content/shop";
import {
  CHECKOUT_DRAFT_KEY,
  checkoutFormSchema,
  emptyAddress,
  toNormalizedCheckoutPayload,
  type CheckoutFormValues,
} from "@/lib/shop/checkout-schema";
import type { DeliveryMethod, PaymentMethod } from "@/lib/shop/settings-schema";
import { CityCombobox } from "@/components/shop/city-combobox";
import { CheckoutSummary } from "@/components/shop/checkout-summary";
import { TurnstileWidget } from "@/components/shop/turnstile-widget";
import { cn } from "cn";

type CheckoutFormProps = {
  deliveryMethods: DeliveryMethod[];
  paymentMethods: PaymentMethod[];
  freeOverCents: number | null;
};

function fieldMessage(code: string | undefined): string {
  switch (code) {
    case "email":
      return shopCopy.fieldEmail;
    case "phone":
      return shopCopy.fieldPhone;
    case "city":
      return shopCopy.fieldCity;
    case "terms":
      return shopCopy.fieldTerms;
    case "turnstile":
      return shopCopy.fieldTurnstile;
    default:
      return shopCopy.fieldRequired;
  }
}

function AddressFields({
  prefix,
  control,
  register,
  errors,
}: {
  prefix: "delivery" | "billing";
  control: Control<CheckoutFormValues>;
  register: UseFormRegister<CheckoutFormValues>;
  errors: FieldErrors<CheckoutFormValues>;
}) {
  const block = errors[prefix];

  return (
    <div className="grid gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span>{shopCopy.checkoutRecipient}</span>
        <input
          {...register(`${prefix}.recipient`)}
          autoComplete="name"
          className={cn(
            "min-h-11 border border-border bg-surface px-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            block?.recipient && "border-danger",
          )}
        />
        {block?.recipient ? (
          <span className="text-xs text-danger" role="alert">
            {fieldMessage(block.recipient.message)}
          </span>
        ) : null}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>{shopCopy.checkoutAddress}</span>
        <input
          {...register(`${prefix}.address`)}
          autoComplete="street-address"
          className={cn(
            "min-h-11 border border-border bg-surface px-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            block?.address && "border-danger",
          )}
        />
        {block?.address ? (
          <span className="text-xs text-danger" role="alert">
            {fieldMessage(block.address.message)}
          </span>
        ) : null}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span>{shopCopy.checkoutCity}</span>
          <Controller
            name={`${prefix}.city`}
            control={control}
            render={({ field }) => (
              <CityCombobox
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={Boolean(block?.city)}
              />
            )}
          />
          {block?.city ? (
            <span className="text-xs text-danger" role="alert">
              {fieldMessage(block.city.message)}
            </span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span>{shopCopy.checkoutPostal}</span>
          <input
            {...register(`${prefix}.postalCode`)}
            autoComplete="postal-code"
            className="min-h-11 border border-border bg-surface px-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span>{shopCopy.checkoutCountry}</span>
        <input
          value={shopCopy.checkoutCountryKosovo}
          readOnly
          tabIndex={-1}
          className="min-h-11 border border-border bg-surface-2 px-3 text-ink-muted"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>{shopCopy.checkoutPhone}</span>
        <input
          {...register(`${prefix}.phone`)}
          type="tel"
          autoComplete="tel"
          placeholder="+383 49 123 456"
          className={cn(
            "min-h-11 border border-border bg-surface px-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            block?.phone && "border-danger",
          )}
        />
        <span className="text-xs text-ink-muted">{shopCopy.checkoutPhoneHint}</span>
        {block?.phone ? (
          <span className="text-xs text-danger" role="alert">
            {fieldMessage(block.phone.message)}
          </span>
        ) : null}
      </label>
    </div>
  );
}

export function CheckoutForm({
  deliveryMethods,
  paymentMethods,
  freeOverCents,
}: CheckoutFormProps) {
  const activeDelivery = useMemo(
    () => deliveryMethods.filter((m) => m.active),
    [deliveryMethods],
  );
  const activePayment = useMemo(
    () =>
      [...paymentMethods]
        .filter((m) => m.active)
        .sort((a, b) => a.order - b.order),
    [paymentMethods],
  );

  const defaultDeliveryId = activeDelivery[0]?.id ?? "kosovo";
  const defaultPaymentId =
    activePayment.find((m) => m.id === "cod")?.id ??
    activePayment[0]?.id ??
    "cod";

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      email: "",
      delivery: emptyAddress(),
      billingSameAsDelivery: true,
      billing: emptyAddress(),
      deliveryMethodId: defaultDeliveryId,
      paymentMethodId: defaultPaymentId as CheckoutFormValues["paymentMethodId"],
      newsletterOptIn: false,
      termsAccepted: false,
      website: "",
      turnstileToken: "",
    },
    mode: "onBlur",
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = form;

  const billingSame = watch("billingSameAsDelivery");
  const deliveryMethodId = watch("deliveryMethodId");

  // Restore draft once.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<CheckoutFormValues>;
      reset({
        email: parsed.email ?? "",
        delivery: { ...emptyAddress(), ...parsed.delivery, country: "XK" },
        billingSameAsDelivery: parsed.billingSameAsDelivery ?? true,
        billing: { ...emptyAddress(), ...parsed.billing, country: "XK" },
        deliveryMethodId: parsed.deliveryMethodId ?? defaultDeliveryId,
        paymentMethodId:
          (parsed.paymentMethodId as CheckoutFormValues["paymentMethodId"]) ??
          defaultPaymentId,
        newsletterOptIn: parsed.newsletterOptIn ?? false,
        termsAccepted: false,
        website: "",
        turnstileToken: "",
      });
    } catch {
      // ignore bad draft
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot only
  }, []);

  // Persist draft (no secrets beyond form fields).
  useEffect(() => {
    const sub = watch((values) => {
      try {
        const draft = { ...values };
        delete draft.turnstileToken;
        delete draft.website;
        sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));
      } catch {
        // quota
      }
    });
    return () => sub.unsubscribe();
  }, [watch]);

  function onSubmit(values: CheckoutFormValues) {
    // Unit 17 wires POST /api/orders. Validate + normalize only for now.
    toNormalizedCheckoutPayload(values);
    toast.message(shopCopy.checkoutSubmitSoon);
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-8"
        noValidate
      >
        <h1 className="font-display text-3xl tracking-display text-ink md:text-4xl">
          {shopCopy.checkoutTitle}
        </h1>

        {/* Honeypot */}
        <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden>
          <label>
            Website
            <input
              tabIndex={-1}
              autoComplete="off"
              {...register("website")}
            />
          </label>
        </div>

        <section className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span>{shopCopy.checkoutEmail}</span>
            <input
              {...register("email")}
              type="email"
              autoComplete="email"
              className={cn(
                "min-h-11 border border-border bg-surface px-3 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                errors.email && "border-danger",
              )}
            />
            {errors.email ? (
              <span className="text-xs text-danger" role="alert">
                {fieldMessage(errors.email.message)}
              </span>
            ) : null}
          </label>

          <AddressFields
            prefix="delivery"
            control={control}
            register={register}
            errors={errors}
          />

          <label className="flex items-start gap-3 text-sm text-ink">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-[var(--color-accent)]"
              {...register("billingSameAsDelivery")}
            />
            <span>{shopCopy.checkoutBillingSame}</span>
          </label>

          {!billingSame ? (
            <div className="flex flex-col gap-4 border border-border p-4">
              <p className="font-medium">{shopCopy.checkoutBillingHeading}</p>
              <AddressFields
                prefix="billing"
                control={control}
                register={register}
                errors={errors}
              />
            </div>
          ) : null}
        </section>

        <section className="flex flex-col gap-3">
          <p className="text-sm font-medium text-ink">
            {shopCopy.checkoutDeliveryMethod}
          </p>
          <div className="flex flex-col gap-2">
            {activeDelivery.map((method) => (
              <label
                key={method.id}
                className="flex min-h-11 cursor-pointer items-center gap-3 border border-border px-3 text-sm"
              >
                <input
                  type="radio"
                  value={method.id}
                  {...register("deliveryMethodId")}
                  className="accent-[var(--color-accent)]"
                />
                <span>
                  {method.label} · {method.days}
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <p className="text-sm font-medium text-ink">
            {shopCopy.checkoutPaymentMethod}
          </p>
          <div className="flex flex-col gap-2">
            {activePayment.map((method) => (
              <label
                key={method.id}
                className="flex min-h-11 cursor-pointer items-start gap-3 border border-border px-3 py-2 text-sm"
              >
                <input
                  type="radio"
                  value={method.id}
                  {...register("paymentMethodId")}
                  className="mt-1 accent-[var(--color-accent)]"
                />
                <span>
                  <span className="font-medium">{method.label}</span>
                  {method.description ? (
                    <span className="mt-0.5 block text-ink-muted">
                      {method.description}
                    </span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        </section>

        <label className="flex items-start gap-3 text-sm text-ink">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-[var(--color-accent)]"
            {...register("newsletterOptIn")}
          />
          <span>{shopCopy.checkoutNewsletter}</span>
        </label>

        <label className="flex items-start gap-3 text-sm text-ink">
          <input
            type="checkbox"
            className="mt-1 size-4 accent-[var(--color-accent)]"
            {...register("termsAccepted")}
          />
          <span>
            {shopCopy.checkoutTerms}{" "}
            <Link
              href="/kushtet"
              className="text-accent underline-offset-4 hover:underline"
            >
              {shopCopy.checkoutTermsLink}
            </Link>
            {" · "}
            <Link
              href="/privatesia"
              className="text-accent underline-offset-4 hover:underline"
            >
              {shopCopy.checkoutPrivacyLink}
            </Link>
          </span>
        </label>
        {errors.termsAccepted ? (
          <span className="text-xs text-danger" role="alert">
            {fieldMessage(errors.termsAccepted.message)}
          </span>
        ) : null}

        <div>
          <TurnstileWidget
            onToken={(token) =>
              setValue("turnstileToken", token, { shouldValidate: true })
            }
            onExpire={() => setValue("turnstileToken", "")}
          />
          {errors.turnstileToken ? (
            <span className="mt-1 block text-xs text-danger" role="alert">
              {fieldMessage(errors.turnstileToken.message)}
            </span>
          ) : null}
        </div>

        <button
          type="submit"
          className="min-h-11 bg-ink px-5 text-sm font-medium text-on-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {shopCopy.checkoutSubmit}
        </button>
      </form>

      <CheckoutSummary
        deliveryMethodId={deliveryMethodId}
        deliveryMethods={activeDelivery}
        freeOverCents={freeOverCents}
      />
    </div>
  );
}
