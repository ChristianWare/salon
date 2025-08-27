/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/(admin)/admin/bookings/[id]/page.tsx
import { redirect, notFound } from "next/navigation";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import Link from "next/link";
import ActionBar from "@/components/admin/ActionBar/ActionBar";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TZ = process.env.SALON_TZ ?? "America/Phoenix";
const BASE_PATH = "/admin/bookings";

export default async function BookingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Admin guard
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  // Load booking
  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, id: true } },
      groomer: {
        include: { user: { select: { name: true, email: true, id: true } } },
      },
      service: {
        select: { id: true, name: true, priceCents: true, durationMin: true },
      },
    },
  });
  if (!booking) notFound();

  // ── Pull refunds from Stripe (admin + user initiated) ────────────────
  let refunds:
    | {
        id: string;
        amount: number;
        created: number;
        status: string;
        charge?: string | null;
        currency?: string | null;
        reason?: string | null;
      }[]
    | null = null;

  if (booking.paymentIntentId) {
    try {
      const list = await stripe.refunds.list({
        payment_intent: booking.paymentIntentId,
        limit: 20,
      });
      refunds = list.data.map((r) => ({
        id: r.id,
        amount: r.amount,
        created: r.created,
        status: r.status ?? "unknown",
        charge:
          typeof r.charge === "string" ? r.charge : (r.charge?.id ?? null),
        currency: r.currency ?? "usd",
        reason: r.reason ?? null,
      }));
    } catch {
      refunds = null; // hide refunds panel if Stripe call fails
    }
  }

  // ── Formatters ───────────────────────────────────────────────────────
  const dateFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
  const timeFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
  const fmt = (cents?: number | null) =>
    typeof cents === "number" ? `$${(cents / 100).toFixed(2)}` : "—";

  // ── Appointment times ────────────────────────────────────────────────
  const start = new Date(booking.start);
  const end = booking.end ? new Date(booking.end) : null;

  const startDate = dateFmt.format(start);
  const startTime = timeFmt.format(start);
  const endTime = end ? timeFmt.format(end) : null;

  const createdDate = dateFmt.format(new Date(booking.createdAt));
  const createdTime = timeFmt.format(new Date(booking.createdAt));
  const updatedDate = dateFmt.format(new Date(booking.updatedAt));
  const updatedTime = timeFmt.format(new Date(booking.updatedAt));

  // ── People / service ────────────────────────────────────────────────
  const customer = booking.user?.name || booking.user?.email || "—";
  const customerEmail = booking.user?.email || null;
  const groomerName =
    booking.groomer?.user?.name || booking.groomer?.user?.email || "—";
  const serviceName = booking.service?.name || "—";
  const durationMin = booking.service?.durationMin ?? null;

  // ── Payment breakdown (robust to missing fields) ─────────────────────
  const basePriceCents = booking.service?.priceCents ?? null;
  const depositCents = booking.depositCents ?? 0; // charged now before tax/fees
  const taxCents = booking.taxCents ?? 0; // tax on what's charged now
  const tipCents = booking.tipCents ?? 0; // tip charged now
  // Optional: if you add this column later in your schema, it will appear automatically
  const feeCents = (booking as any).feeCents ?? 0;

  // If you persisted "amountDueCents" (typically deposit + tax), prefer it to reflect server authority
  const amountDueCents = booking.amountDueCents ?? null;

  // Subtotal charged now (pre-tax/fees): use explicit depositCents
  const subtotalNowCents = depositCents;

  // Total actually charged on the intent (today)
  const totalChargedCents =
    (typeof amountDueCents === "number"
      ? amountDueCents // usually deposit + tax
      : subtotalNowCents + taxCents) +
    tipCents +
    feeCents;

  // Remaining balance hint (pre-tax): if using deposits
  const remainingPreTax =
    typeof basePriceCents === "number" && depositCents < basePriceCents
      ? Math.max(0, basePriceCents - depositCents)
      : 0;

  // Old single value you had (kept for reference, now superseded by the breakdown)
  const priceCents =
    booking.amountDueCents != null
      ? booking.amountDueCents
      : (booking.service?.priceCents ?? null);
  const price =
    typeof priceCents === "number" ? `$${(priceCents / 100).toFixed(2)}` : "—";

  const status = String(booking.status || "");
  const isCanceled = status === "CANCELED";
  const notes = booking.notes ?? null;

  // Stripe dashboard mode helper for links
  const stripeMode = (process.env.STRIPE_SECRET_KEY || "").includes("_test")
    ? "test"
    : "live";

  return (
    <section style={{ padding: "2rem" }}>
      {/* Header / Breadcrumbs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: "1rem",
        }}
      >
        <Link
          href={BASE_PATH}
          style={{ color: "#0969da", textDecoration: "none" }}
        >
          ← Back to Bookings
        </Link>
        <div style={{ fontSize: 14, color: "#666" }}>ID: {booking.id}</div>
      </div>

      {/* Title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 12,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
          Booking Details
        </h1>
        <StatusBadge status={status} />
      </div>

      {/* Details grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 12,
          maxWidth: 960,
        }}
      >
        <div style={cardSoft}>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            {/* Appointment */}
            <div>
              <div style={sectionTitle}>Appointment</div>
              <Row label='Date' value={startDate} />
              <Row
                label='Time'
                value={endTime ? `${startTime} – ${endTime}` : startTime}
              />
              {durationMin ? (
                <Row label='Duration' value={`${durationMin} min`} />
              ) : null}
              <Row label='Timezone' value={TZ} />
              <Row label='Status' value={<StatusBadge status={status} />} />
            </div>

            {/* Booked */}
            <div>
              <div style={sectionTitle}>Booked</div>
              <Row label='Booked On' value={`${createdDate} ${createdTime}`} />
              <Row
                label='Last Updated'
                value={`${updatedDate} ${updatedTime}`}
              />
            </div>

            {/* Customer */}
            <div>
              <div style={sectionTitle}>Customer</div>
              <Row label='Name / Email' value={customer} />
              {customerEmail ? (
                <Row
                  label='Email'
                  value={
                    <a
                      href={`mailto:${customerEmail}`}
                      style={{ color: "#0969da", textDecoration: "none" }}
                    >
                      {customerEmail}
                    </a>
                  }
                />
              ) : null}
            </div>

            {/* Groomer */}
            <div>
              <div style={sectionTitle}>Groomer</div>
              <Row label='Assigned To' value={groomerName} />
            </div>

            {/* Service */}
            <div>
              <div style={sectionTitle}>Service</div>
              <Row label='Service' value={serviceName} />
              {typeof basePriceCents === "number" ? (
                <Row label='Service Price' value={fmt(basePriceCents)} />
              ) : null}

              {/* Payment breakdown */}
              <div style={{ ...sectionTitle, marginTop: 10 }}>
                Payment Breakdown
              </div>
              {/* Subtotal/Deposit */}
              <Row
                label={
                  typeof basePriceCents === "number" &&
                  depositCents < basePriceCents
                    ? "Deposit (charged today)"
                    : "Subtotal (charged today)"
                }
                value={fmt(subtotalNowCents)}
              />
              {/* Tax */}
              {taxCents > 0 && <Row label='Tax' value={fmt(taxCents)} />}
              {/* Tip */}
              {tipCents > 0 && <Row label='Tip' value={fmt(tipCents)} />}
              {/* Fees (optional) */}
              {feeCents > 0 && <Row label='Fees' value={fmt(feeCents)} />}

              {/* Total charged */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "140px 1fr",
                  gap: 8,
                  padding: "6px 0",
                  borderTop: "1px solid #f5f5f5",
                  marginTop: 6,
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: 12, color: "#111", fontWeight: 600 }}>
                  Total Charged Today
                </div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {fmt(totalChargedCents)}
                </div>
              </div>

              {/* Remaining balance (pre-tax) if applicable */}
              {remainingPreTax > 0 && (
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                  Remaining service balance (pre-tax):{" "}
                  <strong>{fmt(remainingPreTax)}</strong> due at appointment.
                </div>
              )}

              {/* Technical payment refs */}
              {booking.paymentIntentId ? (
                <Row
                  label='Payment Intent'
                  value={<Mono>{booking.paymentIntentId}</Mono>}
                />
              ) : null}
              {booking.receiptUrl ? (
                <Row
                  label='Payment Receipt'
                  value={
                    <a
                      href={booking.receiptUrl}
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

            {/* Refunds */}
            {refunds && refunds.length > 0 && (
              <div>
                <div style={sectionTitle}>Refunds</div>
                <div>
                  {refunds.map((r) => {
                    const dt = new Date(r.created * 1000);
                    const date = dateFmt.format(dt);
                    const time = timeFmt.format(dt);
                    const amount = (r.amount / 100).toFixed(2);
                    const dashUrl = `https://dashboard.stripe.com/${
                      stripeMode === "test" ? "test/" : ""
                    }refunds/${r.id}`;
                    return (
                      <div
                        key={r.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "140px 1fr",
                          gap: 8,
                          padding: "6px 0",
                          borderBottom: "1px solid #f5f5f5",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ fontSize: 12, color: "#666" }}>
                          Refunded
                        </div>
                        <div style={{ fontSize: 14 }}>
                          ${amount} • {r.status}
                          {r.reason ? ` • ${r.reason}` : ""}
                          <div style={{ fontSize: 12, color: "#666" }}>
                            {date} {time}
                          </div>
                          <div style={{ marginTop: 4 }}>
                            <a
                              href={dashUrl}
                              target='_blank'
                              rel='noreferrer'
                              style={{ color: "#0969da" }}
                            >
                              View in Stripe
                            </a>{" "}
                            •{" "}
                            <Link
                              href={`/receipt/refund/${r.id}`}
                              style={{ color: "#0969da" }}
                            >
                              Public refund receipt
                            </Link>
                            {r.charge ? (
                              <>
                                {" "}
                                • Charge: <Mono>{r.charge}</Mono>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <div style={sectionTitle}>Notes</div>
              <div
                style={{
                  fontSize: 14,
                  padding: "6px 0",
                  borderBottom: "1px solid #f5f5f5",
                  whiteSpace: "pre-wrap",
                }}
              >
                {notes ? notes : <span style={{ color: "#666" }}>—</span>}
              </div>
            </div>

            {/* Technical */}
            <div>
              <div style={sectionTitle}>Technical</div>
              <Row label='Booking ID' value={<Mono>{booking.id}</Mono>} />
              <Row label='User ID' value={<Mono>{booking.userId}</Mono>} />
              <Row
                label='Groomer ID'
                value={<Mono>{booking.groomerId}</Mono>}
              />
              <Row
                label='Service ID'
                value={<Mono>{booking.serviceId}</Mono>}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={cardSoft}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 8,
            }}
          >
            <div style={{ fontWeight: 600 }}>Actions</div>
            <span style={{ fontSize: 12, color: "#666" }}>
              Update the booking status
            </span>
          </div>
          <ActionBar
            bookingId={booking.id}
            status={status}
            isCanceled={isCanceled}
          />
        </div>
      </div>
    </section>
  );
}

/* ───────────── UI helpers ───────────── */
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

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "CONFIRMED"
      ? "#0a7"
      : status === "PENDING" || status === "PENDING_PAYMENT"
        ? "#d88a00"
        : status === "COMPLETED"
          ? "#0366d6"
          : status === "CANCELED"
            ? "#999"
            : "#b33636"; // NO_SHOW or else
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 999,
        color: "white",
        background: color,
        fontSize: 12,
      }}
    >
      {status.replace("_", " ")}
    </span>
  );
}

/* shared inline tokens */
const cardSoft: React.CSSProperties = {
  border: "1px solid #e5e5e5",
  borderRadius: 8,
  padding: 12,
  background: "white",
};
const sectionTitle: React.CSSProperties = {
  fontWeight: 600,
  marginBottom: 6,
  color: "#111",
  fontSize: 14,
};
