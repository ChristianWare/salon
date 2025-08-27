// src/components/booking/CheckoutStep.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import toast from "react-hot-toast";

/** ─────────────────────────────────────────────────────────
 *  Types
 *  (Add optional breakdown props)
 *  ───────────────────────────────────────────────────────── */
type CheckoutStepProps = {
  bookingId: string;
  clientSecret: string;

  // totals (existing)
  amountDueCents?: number;

  // optional breakdown (pass these if you have them)
  basePriceCents?: number; // full service price (pre-tax/fees/discounts)
  depositCents?: number; // charged now before tax if using deposits
  taxCents?: number; // tax charged now
  feeCents?: number; // fees charged now
  discountCents?: number; // discount applied now (positive number; will be subtracted)

  // summary labels
  serviceName?: string;
  durationMin?: number;
  groomerName?: string;
  dateLabel?: string; // e.g., "Aug 26, 2025"
  timeLabel?: string; // e.g., "2:30 PM"
  onDone?: (status: "CONFIRMED" | "PENDING" | "UNKNOWN") => void;
};

/** ─────────────────────────────────────────────────────────
 *  Stripe loader with guard
 *  ───────────────────────────────────────────────────────── */
const PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!PK) {
  console.error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
}
const stripePromise: Promise<Stripe | null> = PK
  ? loadStripe(PK)
  : Promise.resolve(null);

/** Helpers */
function fmt(cents?: number) {
  if (typeof cents !== "number") return "—";
  return `$${(cents / 100).toFixed(2)}`;
}
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));
const toCents = (val: string) =>
  Math.round(clamp(parseFloat(val || "0"), 0, 1_000_000) * 100);

/** ─────────────────────────────────────────────────────────
 *  Outer wrapper (provides <Elements>)
 *  ───────────────────────────────────────────────────────── */
export default function CheckoutStep(props: CheckoutStepProps) {
  const { clientSecret } = props;

  const options = useMemo(
    () =>
      clientSecret
        ? ({ clientSecret, appearance: { labels: "above" as const } } as const)
        : undefined,
    [clientSecret]
  );

  if (!clientSecret) {
    return <div style={{ color: "#666" }}>Preparing secure payment…</div>;
  }
  if (!PK) {
    return (
      <div style={{ color: "#b33636" }}>
        Payments aren’t configured: missing{" "}
        <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>.
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutInner {...props} />
    </Elements>
  );
}

/** ─────────────────────────────────────────────────────────
 *  Inner component (uses PaymentElement)
 *  ───────────────────────────────────────────────────────── */
function CheckoutInner({
  bookingId,
  amountDueCents,
  basePriceCents,
  depositCents,
  taxCents,
  feeCents,
  discountCents,
  serviceName,
  durationMin,
  groomerName,
  dateLabel,
  timeLabel,
  onDone,
}: CheckoutStepProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  // Tip state
  const [tipCents, setTipCents] = useState<number>(0);
  const [updatingTip, setUpdatingTip] = useState(false);
  const [customTipInput, setCustomTipInput] = useState<string>("");

  /** Compute a clean breakdown safely (without tip) */
  const breakdown = useMemo(() => {
    const subtotalCents =
      typeof depositCents === "number"
        ? depositCents
        : typeof amountDueCents === "number"
          ? amountDueCents -
            (taxCents ?? 0) -
            (feeCents ?? 0) +
            (discountCents ?? 0)
          : undefined;

    const taxNow = typeof taxCents === "number" ? taxCents : 0;
    const feeNow = typeof feeCents === "number" ? feeCents : 0;
    const discountNow = typeof discountCents === "number" ? discountCents : 0;

    const calcTotal =
      typeof subtotalCents === "number"
        ? subtotalCents + taxNow + feeNow - discountNow
        : undefined;

    const totalCents =
      typeof amountDueCents === "number" ? amountDueCents : calcTotal;

    const hasDeposit =
      typeof basePriceCents === "number" &&
      typeof depositCents === "number" &&
      depositCents < basePriceCents;

    const remainingPreTax = hasDeposit
      ? Math.max(0, basePriceCents! - depositCents!)
      : 0;

    return {
      subtotalCents,
      taxNow,
      feeNow,
      discountNow,
      totalCents,
      hasDeposit,
      remainingPreTax,
    };
  }, [
    amountDueCents,
    basePriceCents,
    depositCents,
    taxCents,
    feeCents,
    discountCents,
  ]);

  // Final total user pays now (incl. tip)
  const finalDueNowCents = (breakdown.totalCents ?? 0) + tipCents;

  /** Tip helpers & selection state */
  const tipBaseCents =
    typeof basePriceCents === "number"
      ? basePriceCents
      : (breakdown.subtotalCents ?? 0);

  const presetPercents = [20, 25, 30, 40];
  const tipForPct = (p: number) => Math.round((tipBaseCents * p) / 100);
  const isPresetSelected = (p: number) => tipCents === tipForPct(p);
  const isCustomSelected =
    tipCents > 0 && !presetPercents.some((p) => isPresetSelected(p));

  /** Update tip on server (updates PaymentIntent amount and saves booking.tipCents) */
  async function updateTipOnServer(newTipCents: number) {
    try {
      setUpdatingTip(true);
      const res = await fetch("/api/book/set-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, tipCents: newTipCents }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Could not update tip.");
        return;
      }
      setTipCents(data.tipCents ?? newTipCents);
      toast.success(data.tipCents > 0 ? "Tip added" : "Tip removed");
    } catch (e: any) {
      toast.error(e?.message || "Could not update tip.");
    } finally {
      setUpdatingTip(false);
    }
  }

  /** Tip button handlers */
  function tipFromPercent(pct: number) {
    const cents = tipForPct(pct);
    setCustomTipInput("");
    updateTipOnServer(cents);
  }
  function tipNone() {
    setCustomTipInput("");
    updateTipOnServer(0);
  }
  function tipFromCustom() {
    const cents = toCents(customTipInput);
    updateTipOnServer(cents);
  }

  /** Pay */
  async function handlePay() {
    if (!stripe || !elements) {
      setError("Payments aren’t ready yet. Try reloading the page.");
      return;
    }

    setSubmitting(true);
    setError("");

    const { error: submitErr } = await elements.submit();
    if (submitErr) {
      setSubmitting(false);
      setError(submitErr.message || "Please check your payment details.");
      return;
    }

    const { error: confirmErr } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (confirmErr) {
      setSubmitting(false);
      setError(confirmErr.message || "Payment couldn’t be completed.");
      return;
    }

    try {
      const res = await fetch("/api/book/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitting(false);
        setError(data?.error || "We’re finalizing your booking…");
        toast("We’re finalizing your booking. You can check My Bookings.", {
          icon: "⌛",
        });
        onDone?.("UNKNOWN");
        return;
      }

      setSubmitting(false);
      const status = (data?.status as "CONFIRMED" | "PENDING") || "UNKNOWN";
      toast.success(status === "CONFIRMED" ? "Booked!" : "Request sent!");
      onDone?.(status);
    } catch (e: any) {
      setSubmitting(false);
      setError(e?.message || "Could not finalize your booking.");
      toast("We’re finalizing your booking. You can check My Bookings.", {
        icon: "⌛",
      });
      onDone?.("UNKNOWN");
    }
  }

  return (
    <div style={wrap}>
      {/* Summary */}
      <div style={summaryCard}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Review</div>
        <div style={row}>
          <span style={muted}>Service</span>
          <span>{serviceName ?? "—"}</span>
        </div>
        <div style={row}>
          <span style={muted}>Duration</span>
          <span>{durationMin ? `${durationMin} min` : "—"}</span>
        </div>
        <div style={row}>
          <span style={muted}>Groomer</span>
          <span>{groomerName ?? "—"}</span>
        </div>
        <div style={row}>
          <span style={muted}>Date</span>
          <span>{dateLabel ?? "—"}</span>
        </div>
        <div style={row}>
          <span style={muted}>Time</span>
          <span>{timeLabel ?? "—"}</span>
        </div>

        {/* Optional: show full service price if provided */}
        {typeof basePriceCents === "number" && (
          <div style={{ ...row, marginTop: 8 }}>
            <span style={muted}>Service price</span>
            <span>{fmt(basePriceCents)}</span>
          </div>
        )}

        {/* Breakdown (Subtotal/Deposit, Tax, Fees, Discount) */}
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: "1px solid #eee",
            display: "grid",
            gap: 6,
          }}
        >
          {typeof breakdown.subtotalCents === "number" && (
            <div style={row}>
              <span style={muted}>
                {breakdown.hasDeposit ? "Deposit (today)" : "Subtotal"}
              </span>
              <span>{fmt(breakdown.subtotalCents)}</span>
            </div>
          )}

          {breakdown.taxNow > 0 && (
            <div style={row}>
              <span style={muted}>Tax</span>
              <span>{fmt(breakdown.taxNow)}</span>
            </div>
          )}

          {breakdown.feeNow > 0 && (
            <div style={row}>
              <span style={muted}>Fees</span>
              <span>{fmt(breakdown.feeNow)}</span>
            </div>
          )}

          {breakdown.discountNow > 0 && (
            <div style={row}>
              <span style={muted}>Discount</span>
              <span>-{fmt(breakdown.discountNow)}</span>
            </div>
          )}

          {/* Tip line (if > 0) */}
          {tipCents > 0 && (
            <div style={row}>
              <span style={muted}>Tip</span>
              <span>{fmt(tipCents)}</span>
            </div>
          )}

          <div
            style={{
              ...row,
              borderTop: "1px solid #eee",
              paddingTop: 8,
              marginTop: 4,
            }}
          >
            <span style={{ fontWeight: 600 }}>Due now</span>
            <span style={{ fontWeight: 600 }}>{fmt(finalDueNowCents)}</span>
          </div>

          {/* Remaining balance hint (pre-tax) */}
          {breakdown.hasDeposit && (
            <div style={{ ...small, marginTop: 2 }}>
              Remaining service balance (pre-tax):{" "}
              <strong>{fmt(breakdown.remainingPreTax)}</strong> due at
              appointment.
            </div>
          )}
        </div>
      </div>

      {/* Payment + Tip */}
      <div style={payCard}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Payment</div>

        {/* Tip selector */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ ...small, marginBottom: 6 }}>
            Tip your groomer (optional)
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {/* No tip */}
            <button
              type='button'
              onClick={tipNone}
              disabled={updatingTip}
              style={{
                ...chipBtn,
                ...(tipCents === 0 ? chipSelected : null),
              }}
            >
              No tip
            </button>

            {/* Preset percents */}
            {presetPercents.map((p) => (
              <button
                key={p}
                type='button'
                onClick={() => tipFromPercent(p)}
                disabled={updatingTip}
                style={{
                  ...chipBtn,
                  ...(isPresetSelected(p) ? chipSelected : null),
                }}
                title={
                  typeof basePriceCents === "number"
                    ? `$${((basePriceCents * p) / 100 / 100).toFixed(2)}`
                    : undefined
                }
              >
                {p}%
              </button>
            ))}

            {/* Custom amount */}
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 14 }}>$</span>
              <input
                type='number'
                min={0}
                step='0.01'
                placeholder='Custom'
                value={customTipInput}
                onChange={(e) => setCustomTipInput(e.target.value)}
                style={{
                  ...inputMini,
                  width: 90,
                  ...(isCustomSelected ? inputMiniSelected : null),
                }}
                disabled={updatingTip}
              />
              <button
                type='button'
                onClick={tipFromCustom}
                disabled={updatingTip}
                style={{
                  ...outlineBtnSm,
                  ...(isCustomSelected ? outlineBtnSmSelected : null),
                }}
              >
                Apply
              </button>
            </div>
          </div>

          <div style={{ ...small, marginTop: 6, color: "#666" }}>
            100% of tips go to your groomer.
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <PaymentElement />
        </div>

        {error ? (
          <div style={{ color: "#b33636", marginBottom: 8 }}>{error}</div>
        ) : null}

        <button
          type='button'
          onClick={handlePay}
          disabled={submitting || !stripe || !elements || updatingTip}
          style={{
            ...primaryBtn,
            opacity:
              submitting || !stripe || !elements || updatingTip ? 0.7 : 1,
          }}
        >
          {submitting ? "Processing…" : "Pay & Book"}
        </button>

        <p style={{ ...small, marginTop: 8 }}>
          Your payment info is encrypted and processed by Stripe.
        </p>
      </div>
    </div>
  );
}

/** ─────────────────────────────────────────────────────────
 *  Inline styles
 *  ───────────────────────────────────────────────────────── */
const wrap: React.CSSProperties = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "1fr",
  maxWidth: 640,
};

const summaryCard: React.CSSProperties = {
  border: "1px solid #e5e5e5",
  borderRadius: 8,
  padding: 12,
  background: "white",
};

const payCard: React.CSSProperties = {
  border: "1px solid #e5e5e5",
  borderRadius: 8,
  padding: 12,
  background: "white",
};

const row: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  fontSize: 14,
  padding: "4px 0",
};

const chipBtn: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  background: "white",
  color: "#333",
  border: "1px solid #ddd",
  cursor: "pointer",
};

const chipSelected: React.CSSProperties = {
  background: "#111",
  color: "white",
  border: "1px solid #111",
};

const inputMini: React.CSSProperties = {
  padding: "6px 8px",
  borderRadius: 6,
  border: "1px solid #ddd",
  background: "white",
};

const inputMiniSelected: React.CSSProperties = {
  borderColor: "#111",
  boxShadow: "0 0 0 1px #111 inset",
};

const muted: React.CSSProperties = { color: "#666" };

const primaryBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  background: "#111",
  color: "white",
  border: "1px solid #111",
  cursor: "pointer",
};

const outlineBtnSm: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 6,
  background: "white",
  color: "#333",
  border: "1px solid #ddd",
  cursor: "pointer",
};

const outlineBtnSmSelected: React.CSSProperties = {
  background: "#111",
  color: "white",
  border: "1px solid #111",
};

const small: React.CSSProperties = { fontSize: 12, color: "#666" };
