// src/components/booking/CheckoutStep.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {  useMemo, useState } from "react";
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
 *  (Adjust the summary props as you like)
 *  ───────────────────────────────────────────────────────── */
type CheckoutStepProps = {
  bookingId: string;
  clientSecret: string;
  amountDueCents?: number;
  serviceName?: string;
  durationMin?: number;
  groomerName?: string;
  dateLabel?: string; // e.g., "Aug 26, 2025"
  timeLabel?: string; // e.g., "2:30 PM"
  onDone?: (status: "CONFIRMED" | "PENDING" | "UNKNOWN") => void; // if you want to navigate afterward
};

/** ─────────────────────────────────────────────────────────
 *  Stripe loader with guard
 *  ───────────────────────────────────────────────────────── */
const PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!PK) {
  // Don’t crash the page, but log loudly so you notice in dev
  // (The UI will show “Initializing…” until PK is set)
  console.error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
}
const stripePromise: Promise<Stripe | null> = PK
  ? loadStripe(PK)
  : Promise.resolve(null);

/** ─────────────────────────────────────────────────────────
 *  Outer wrapper (provides <Elements>)
 *  ───────────────────────────────────────────────────────── */
export default function CheckoutStep(props: CheckoutStepProps) {
  const { clientSecret } = props;

  // Only render Elements when we have a clientSecret
  const options = useMemo(
    () =>
      clientSecret
        ? ({
            clientSecret,
            appearance: { labels: "above" as const },
          } as const)
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

  // Simple price formatter
  const price = useMemo(() => {
    if (typeof amountDueCents === "number")
      return (amountDueCents / 100).toFixed(2);
    return undefined;
  }, [amountDueCents]);

  async function handlePay() {
    if (!stripe || !elements) {
      setError("Payments aren’t ready yet. Try reloading the page.");
      return;
    }

    setSubmitting(true);
    setError("");

    // 1) Trigger validation so Element shows inline errors (card number, postal, etc)
    const { error: submitErr } = await elements.submit();
    if (submitErr) {
      setSubmitting(false);
      setError(submitErr.message || "Please check your payment details.");
      return;
    }

    // 2) Confirm the PaymentIntent created in your /api/book/prepare
    const { error: confirmErr } = await stripe.confirmPayment({
      elements,
      redirect: "if_required", // leave it as 'if_required' unless you want to force redirect flow
    });

    if (confirmErr) {
      setSubmitting(false);
      setError(confirmErr.message || "Payment couldn’t be completed.");
      return;
    }

    // 3) Immediately finalize the booking (no webhook dependency)
    try {
      const res = await fetch("/api/book/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();

      if (!res.ok) {
        // If finalize fails, let user know, and you can also poll or fall back to webhook
        setSubmitting(false);
        setError(data?.error || "We’re finalizing your booking…");
        toast("We’re finalizing your booking. You can check My Bookings.", {
          icon: "⌛",
        });
        onDone?.("UNKNOWN");
        return;
      }

      // Success — booking is CONFIRMED or PENDING depending on autoConfirm
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
      {/* Summary (customize or remove) */}
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
        <div
          style={{
            ...row,
            borderTop: "1px solid #eee",
            paddingTop: 8,
            marginTop: 8,
          }}
        >
          <span style={{ fontWeight: 600 }}>Due now</span>
          <span style={{ fontWeight: 600 }}>{price ? `$${price}` : "—"}</span>
        </div>
      </div>

      {/* Payment Element */}
      <div style={payCard}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Payment</div>
        <div style={{ marginBottom: 12 }}>
          <PaymentElement />
        </div>

        {error ? (
          <div style={{ color: "#b33636", marginBottom: 8 }}>{error}</div>
        ) : null}

        <button
          type='button'
          onClick={handlePay}
          disabled={submitting || !stripe || !elements}
          style={{
            ...primaryBtn,
            opacity: submitting || !stripe || !elements ? 0.7 : 1,
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
 *  Inline styles (match your project’s look)
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

const muted: React.CSSProperties = {
  color: "#666",
};

const primaryBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  background: "#111",
  color: "white",
  border: "1px solid #111",
  cursor: "pointer",
};

const small: React.CSSProperties = {
  fontSize: 12,
  color: "#666",
};
