/* eslint-disable @typescript-eslint/no-explicit-any */
// app/receipt/refund/[id]/page.tsx
import { notFound } from "next/navigation";
import { stripe } from "@/lib/stripe";
import { Stripe } from "stripe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BUSINESS_NAME = process.env.BUSINESS_NAME ?? "Your Salon";

export default async function RefundReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Load refund
  let refund;
  try {
    refund = await stripe.refunds.retrieve(id);
  } catch {
    notFound();
  }
  if (!refund) notFound();

  // Get the charge for method / receipt details
  let charge: Stripe.Charge | null = null;
  try {
    const chId =
      typeof refund.charge === "string"
        ? refund.charge
        : (refund.charge as any)?.id;
    if (chId) {
      charge = await stripe.charges.retrieve(chId);
    }
  } catch {
    charge = null;
  }

  const created = new Date(refund.created * 1000);
  const amount = (refund.amount / 100).toFixed(2);
  const currency = (refund.currency || "usd").toUpperCase();

  // Try to show card info if present
  const pmCard =
    charge?.payment_method_details?.card ??
    (charge?.payment_method_details as any)?.card_present ??
    null;

  const brand = pmCard?.brand ?? undefined;
  const last4 = pmCard?.last4 ?? undefined;

  return (
    <main
      style={{
        maxWidth: 680,
        margin: "40px auto",
        border: "1px solid #eee",
        borderRadius: 10,
        padding: 16,
        background: "white",
      }}
    >
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
        Refund Receipt
      </h1>
      <div style={{ color: "#666", marginTop: 4 }}>{BUSINESS_NAME}</div>

      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: "1px solid #f0f0f0",
          display: "grid",
          gap: 8,
        }}
      >
        <Row label='Refund ID' value={<Mono>{refund.id}</Mono>} />
        {refund.reason ? <Row label='Reason' value={refund.reason} /> : null}
        <Row
          label='Date'
          value={`${created.toLocaleDateString()} ${created.toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          )}`}
        />
        <Row label='Status' value={refund.status ?? "unknown"} />
        <Row label='Amount' value={`$${amount} ${currency}`} />
        {brand || last4 ? (
          <Row
            label='Payment Method'
            value={`${brand ? brand.toUpperCase() : "Card"}${
              last4 ? ` •••• ${last4}` : ""
            }`}
          />
        ) : null}
        {charge?.receipt_url ? (
          <Row
            label='Original Receipt'
            value={
              <a
                href={charge.receipt_url}
                target='_blank'
                rel='noreferrer'
                style={{ color: "#0969da", textDecoration: "none" }}
              >
                View payment receipt
              </a>
            }
          />
        ) : null}
      </div>

      <p style={{ fontSize: 12, color: "#666", marginTop: 14 }}>
        This page confirms your refund. If you have questions, contact us at{" "}
        <a
          href={`mailto:${process.env.SUPPORT_EMAIL ?? "support@example.com"}`}
        >
          {process.env.SUPPORT_EMAIL ?? "support@example.com"}
        </a>
        .
      </p>
    </main>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "140px 1fr",
        gap: 8,
        padding: "6px 0",
        borderBottom: "1px solid #f5f5f5",
        alignItems: "center",
      }}
    >
      <div style={{ fontSize: 12, color: "#666" }}>{label}</div>
      <div style={{ fontSize: 14 }}>{value}</div>
    </div>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <code
      style={{
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: 12,
        background: "#fafafa",
        border: "1px solid #eee",
        borderRadius: 4,
        padding: "1px 6px",
      }}
    >
      {children}
    </code>
  );
}
