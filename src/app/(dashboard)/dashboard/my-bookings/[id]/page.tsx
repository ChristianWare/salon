// app/dashboard/my-bookings/[id]/page.tsx
import { redirect, notFound } from "next/navigation";
import { auth } from "../../../../../../auth";
import { db } from "@/lib/db";
import Link from "next/link";
import CancelBookingForm from "@/components/dashboard/CancelBookingForm/CancelBookingForm";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_PATH = "/dashboard/my-bookings";
const TZ = process.env.SALON_TZ ?? "America/Phoenix";

export default async function BookingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const me = session.user.id;

  const { id } = await params;

  // Load booking (verify ownership)
  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      groomer: { include: { user: { select: { name: true, email: true } } } },
      service: {
        select: { id: true, name: true, priceCents: true, durationMin: true },
      },
    },
  });
  if (!booking || booking.userId !== me) notFound();

  // Pull refunds from Stripe by Payment Intent (if any)
  let refunds:
    | {
        id: string;
        amount: number;
        created: number;
        status: string;
        currency: string;
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
        currency: r.currency ?? "usd",
        reason: r.reason ?? null,
      }));
    } catch {
      refunds = null;
    }
  }

  // Settings: cancellation window (hrs)
  const cancelCfg = await db.config.findUnique({
    where: { key: "cancelWindow" },
    select: { value: true },
  });
  const cancelWindowHours = Number(cancelCfg?.value ?? 24);

  // Formatters
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

  const start = new Date(booking.start);
  const end = booking.end ? new Date(booking.end) : null;

  const dateStr = dateFmt.format(start);
  const timeStr = end
    ? `${timeFmt.format(start)} – ${timeFmt.format(end)}`
    : timeFmt.format(start);
  const createdStr = `${dateFmt.format(new Date(booking.createdAt))} ${timeFmt.format(new Date(booking.createdAt))}`;
  const updatedStr = `${dateFmt.format(new Date(booking.updatedAt))} ${timeFmt.format(new Date(booking.updatedAt))}`;

  const groomerName =
    booking.groomer?.user?.name || booking.groomer?.user?.email || "—";

  // Payment breakdown
  const basePriceCents = booking.service?.priceCents ?? null;
  const depositCents = booking.depositCents ?? 0;
  const taxCents = booking.taxCents ?? 0;
  const tipCents = booking.tipCents ?? 0;
  const amountDueCents = booking.amountDueCents ?? null;
  const chargedNowCents =
    typeof amountDueCents === "number"
      ? amountDueCents
      : depositCents + taxCents;
  const totalChargedCents = chargedNowCents + tipCents;

  // Cancellation logic
  const status = String(booking.status || "");
  const now = new Date();
  const cutoff = new Date(start.getTime() - cancelWindowHours * 60 * 60 * 1000);

  const canCancel =
    (status === "PENDING" || status === "CONFIRMED") &&
    start > now &&
    now <= cutoff;

  const cancelReason = !(
    (status === "PENDING" || status === "CONFIRMED") &&
    start > now
  )
    ? "This appointment can no longer be canceled online."
    : now > cutoff
      ? `Cancellations must be at least ${cancelWindowHours} hour${
          cancelWindowHours === 1 ? "" : "s"
        } before the start time.`
      : null;

  return (
    <section style={{ padding: "2rem" }}>
      {/* Breadcrumbs / Back */}
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
          ← Back to My Bookings
        </Link>
        <div style={{ fontSize: 14, color: "#666" }}>ID: {booking.id}</div>
      </div>

      {/* Title + Status */}
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

      {/* Content */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 12,
          maxWidth: 960,
        }}
      >
        {/* Appointment + People */}
        <div style={cardSoft}>
          <div style={{ ...sectionTitle, marginBottom: 8 }}>Appointment</div>
          <Row label='Date' value={dateStr} />
          <Row label='Time' value={timeStr} />
          {booking.service?.durationMin ? (
            <Row
              label='Duration'
              value={`${booking.service.durationMin} min`}
            />
          ) : null}
          <Row label='Timezone' value={TZ} />
          <Row label='Status' value={<StatusBadge status={status} />} />

          <div style={{ ...sectionTitle, marginTop: 12, marginBottom: 8 }}>
            Service
          </div>
          <Row label='Service' value={booking.service?.name ?? "—"} />
          {typeof basePriceCents === "number" ? (
            <Row label='Base price' value={fmt(basePriceCents)} />
          ) : null}

          <div style={{ ...sectionTitle, marginTop: 12, marginBottom: 8 }}>
            Your Pro
          </div>
          <Row label='Groomer' value={groomerName} />
        </div>

        {/* Payment Summary */}
        <div style={cardSoft}>
          <div style={{ ...sectionTitle, marginBottom: 8 }}>Payment</div>

          {typeof basePriceCents === "number" ? (
            <Row label='Service price' value={fmt(basePriceCents)} />
          ) : null}

          <Row
            label={amountDueCents != null ? "Deposit (today)" : "Subtotal"}
            value={fmt(depositCents)}
          />
          {taxCents > 0 && <Row label='Tax' value={fmt(taxCents)} />}
          {tipCents > 0 && <Row label='Tip' value={fmt(tipCents)} />}

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
              Charged
            </div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              {fmt(totalChargedCents)}
            </div>
          </div>

          {booking.paymentIntentId ? (
            <Row
              label='Payment Intent'
              value={<Mono>{booking.paymentIntentId}</Mono>}
            />
          ) : null}
          {booking.receiptUrl ? (
            <Row
              label='Receipt'
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

        {/* Refunds (new) */}
        {refunds && refunds.length > 0 && (
          <div style={cardSoft}>
            <div style={{ ...sectionTitle, marginBottom: 8 }}>Refunds</div>
            {refunds.map((r) => {
              const dt = new Date(r.created * 1000);
              const date = dateFmt.format(dt);
              const time = timeFmt.format(dt);
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
                  <div style={{ fontSize: 12, color: "#666" }}>Refunded</div>
                  <div style={{ fontSize: 14 }}>
                    {fmt(r.amount)} • {r.status}
                    {r.reason ? ` • ${r.reason}` : ""}
                    <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                      {date} {time}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <Link
                        href={`/receipt/refund/${r.id}`}
                        style={{ color: "#0969da", textDecoration: "none" }}
                      >
                        View refund receipt
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Notes / Pet */}
        {(booking.notes || booking.petJson) && (
          <div style={cardSoft}>
            <div style={{ ...sectionTitle, marginBottom: 8 }}>Notes</div>
            <div
              style={{
                fontSize: 14,
                padding: "6px 0",
                borderBottom: "1px solid #f5f5f5",
                whiteSpace: "pre-wrap",
              }}
            >
              {booking.notes ? (
                booking.notes
              ) : (
                <span style={{ color: "#666" }}>—</span>
              )}
            </div>

            {booking.petJson ? (
              <>
                <div
                  style={{ ...sectionTitle, marginTop: 12, marginBottom: 8 }}
                >
                  Pet Details
                </div>
                <pre
                  style={{
                    fontSize: 12,
                    margin: 0,
                    background: "#fafafa",
                    border: "1px solid #eee",
                    borderRadius: 6,
                    padding: 8,
                    overflowX: "auto",
                  }}
                >
                  {JSON.stringify(booking.petJson, null, 2)}
                </pre>
              </>
            ) : null}
          </div>
        )}

        {/* Booked / Meta */}
        <div style={cardSoft}>
          <div style={{ ...sectionTitle, marginBottom: 8 }}>
            Booking Timeline
          </div>
          <Row label='Booked On' value={createdStr} />
          <Row label='Last Updated' value={updatedStr} />
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
              Manage this appointment
            </span>
          </div>

          {status === "CANCELED" ? (
            <div style={{ color: "#666" }}>This booking has been canceled.</div>
          ) : canCancel ? (
            <CancelBookingForm bookingId={booking.id} />
          ) : (
            <div style={{ color: "#666" }}>
              {cancelReason ??
                "Cancellation is not available for this booking."}
            </div>
          )}
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
            : "#b33636";
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

/* small helper */
function fmt(cents: number | null) {
  if (typeof cents !== "number") return "—";
  return `$${(cents / 100).toFixed(2)}`;
}
