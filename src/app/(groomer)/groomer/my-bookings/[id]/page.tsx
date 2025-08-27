// app/groomer/my-bookings/[id]/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { requireGroomer } from "@/lib/rbac";
import ConfirmSubmit from "@/components/shared/ConfirmSubmit/ConfirmSubmit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_LIST_PATH = "/groomer/my-bookings";
const TZ = process.env.SALON_TZ ?? "America/Phoenix";

/* ───────────────────────────── Server actions ───────────────────────────── */
export async function cancelAndRefundSA(formData: FormData): Promise<void> {
  "use server";
  const me = await requireGroomer();
  const bookingId = String(formData.get("id") || "");
  const reason = String(formData.get("reason") || "").trim();

  // Load booking and ensure ownership
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      service: { select: { priceCents: true, name: true } },
    },
  });
  if (!booking || booking.groomerId !== me.id) throw new Error("Unauthorized");

  const now = new Date();
  const isFuture = new Date(booking.start) > now;
  const isCancelable = booking.status === "PENDING" || booking.status === "CONFIRMED";

  // If not eligible for refund, just cancel (no refund)
  if (!isFuture || !isCancelable || !booking.paymentIntentId) {
    await db.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELED",
        notes: appendNote(booking.notes, `Canceled by groomer.${reason ? " " + reason : ""}`),
      },
    });
    revalidatePath(`${BASE_LIST_PATH}/${bookingId}`);
    revalidatePath(BASE_LIST_PATH);
    return;
  }

  // Compute amount that was charged now
  const deposit = booking.depositCents ?? 0;
  const tax = booking.taxCents ?? 0;
  const fee = (booking as any).feeCents ?? 0;        // safe read if not in schema
  const discount = (booking as any).discountCents ?? 0; // safe read if not in schema
  const tip = booking.tipCents ?? 0;
  const amountDue = booking.amountDueCents; // generally deposit+tax(+fees−discount)

  const coreNow =
    typeof amountDue === "number" ? amountDue : Math.max(0, deposit + tax + fee - discount);
  const chargedNow = Math.max(0, coreNow + tip);

  if (chargedNow > 0) {
    await stripe.refunds.create({
      payment_intent: booking.paymentIntentId,
      amount: chargedNow,
      reason: "requested_by_customer",
      metadata: {
        bookingId: booking.id,
        userId: booking.userId,
        groomerId: booking.groomerId,
        canceledBy: `groomer:${me.id}`,
      },
    });
  }

  await db.booking.update({
    where: { id: bookingId },
    data: {
      status: "CANCELED",
      notes: appendNote(
        booking.notes,
        reason ? `Canceled by groomer: ${reason}` : "Canceled by groomer."
      ),
    },
  });

  revalidatePath(`${BASE_LIST_PATH}/${bookingId}`);
  revalidatePath(BASE_LIST_PATH);
}

export async function markCompletedSA(formData: FormData): Promise<void> {
  "use server";
  const me = await requireGroomer();
  const bookingId = String(formData.get("id") || "");
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: { groomerId: true },
  });
  if (!booking || booking.groomerId !== me.id) throw new Error("Unauthorized");
  await db.booking.update({ where: { id: bookingId }, data: { status: "COMPLETED" } });
  revalidatePath(`${BASE_LIST_PATH}/${bookingId}`);
  revalidatePath(BASE_LIST_PATH);
}

export async function markNoShowSA(formData: FormData): Promise<void> {
  "use server";
  const me = await requireGroomer();
  const bookingId = String(formData.get("id") || "");
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    select: { groomerId: true },
  });
  if (!booking || booking.groomerId !== me.id) throw new Error("Unauthorized");
  await db.booking.update({ where: { id: bookingId }, data: { status: "NO_SHOW" } });
  revalidatePath(`${BASE_LIST_PATH}/${bookingId}`);
  revalidatePath(BASE_LIST_PATH);
}

/* ──────────────────────────────────────────────────────────────
   Page
────────────────────────────────────────────────────────────── */
export default async function BookingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const groomer = await requireGroomer();
  const { id } = await params;

  // Load booking & enforce ownership
  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, id: true } },
      service: {
        select: { id: true, name: true, priceCents: true, durationMin: true },
      },
      groomer: { select: { id: true } },
    },
  });
  if (!booking || booking.groomerId !== groomer.id) notFound();

  // Pull refunds from Stripe (shows admin- or user-initiated)
  let refunds:
    | {
        id: string;
        amount: number;
        created: number;
        status: string;
        currency?: string | null;
        reason?: string | null;
        charge?: string | null;
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
        charge: typeof r.charge === "string" ? r.charge : (r.charge?.id ?? null),
      }));
    } catch {
      refunds = null;
    }
  }

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

  // Payment breakdown (robust + TS-safe)
  const basePriceCents = booking.service?.priceCents ?? null;
  const depositCents = booking.depositCents ?? 0;
  const taxCents = booking.taxCents ?? 0;
  const feeCents = (booking as any).feeCents ?? 0;           // TS-safe
  const discountCents = (booking as any).discountCents ?? 0; // TS-safe (positive, subtract)
  const tipCents = booking.tipCents ?? 0;
  const amountDueCents = booking.amountDueCents ?? null; // generally deposit+tax(+fees−discount)

  const subtotalNowCents =
    typeof amountDueCents === "number"
      ? Math.max(0, amountDueCents - taxCents - feeCents + discountCents)
      : depositCents;

  const coreDueNowCents =
    typeof amountDueCents === "number"
      ? amountDueCents
      : Math.max(0, depositCents + taxCents + feeCents - discountCents);

  const totalChargedCents = coreDueNowCents + tipCents;

  const status = String(booking.status || "");
  const isCanceled = status === "CANCELED";

//   const stripeMode = (process.env.STRIPE_SECRET_KEY || "").includes("_test")
//     ? "test"
//     : "live";

  const cancelFormId = `cancel-refund-${booking.id}`;

  return (
    <section style={{ padding: "2rem" }}>
      {/* Breadcrumbs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: "1rem",
        }}
      >
        <Link href={BASE_LIST_PATH} style={{ color: "#0969da", textDecoration: "none" }}>
          ← Back to My Bookings
        </Link>
        <div style={{ fontSize: 14, color: "#666" }}>ID: {booking.id}</div>
      </div>

      {/* Title + status */}
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
          Appointment Details
        </h1>
        <StatusBadge status={status} />
      </div>

      {/* Content grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, maxWidth: 960 }}>
        {/* Appointment details */}
        <div style={card}>
          <div style={sectionTitle}>Appointment</div>
          <Row label="Date" value={dateStr} />
          <Row label="Time" value={timeStr} />
          {booking.service?.durationMin ? (
            <Row label="Duration" value={`${booking.service.durationMin} min`} />
          ) : null}
          <Row label="Timezone" value={TZ} />
          <Row label="Status" value={<StatusBadge status={status} />} />

          <div style={{ ...sectionTitle, marginTop: 12 }}>Customer</div>
          <Row
            label="Name"
            value={booking.user?.name || booking.user?.email || "—"}
          />
          {booking.user?.email ? (
            <Row
              label="Email"
              value={
                <a
                  href={`mailto:${booking.user.email}`}
                  style={{ color: "#0969da", textDecoration: "none" }}
                >
                  {booking.user.email}
                </a>
              }
            />
          ) : null}

          <div style={{ ...sectionTitle, marginTop: 12 }}>Service</div>
          <Row label="Service" value={booking.service?.name ?? "—"} />
          {typeof basePriceCents === "number" ? (
            <Row label="Service price" value={fmt(basePriceCents)} />
          ) : null}
        </div>

        {/* Payment breakdown */}
        <div style={card}>
          <div style={sectionTitle}>Payment</div>

          {typeof basePriceCents === "number" ? (
            <Row label="Base price" value={fmt(basePriceCents)} />
          ) : null}

          <Row
            label={amountDueCents != null ? "Deposit (today)" : "Subtotal"}
            value={fmt(subtotalNowCents)}
          />
          {taxCents > 0 && <Row label="Tax" value={fmt(taxCents)} />}
          {feeCents > 0 && <Row label="Fees" value={fmt(feeCents)} />}
          {discountCents > 0 && <Row label="Discount" value={`-${fmt(discountCents)}`} />}
          {tipCents > 0 && <Row label="Tip" value={fmt(tipCents)} />}

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
            <div style={{ fontSize: 12, color: "#111", fontWeight: 600 }}>Charged</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{fmt(totalChargedCents)}</div>
          </div>

          {booking.paymentIntentId ? (
            <Row
              label="Payment Intent"
              value={<Mono>{booking.paymentIntentId}</Mono>}
            />
          ) : null}
          {booking.receiptUrl ? (
            <Row
              label="Receipt"
              value={
                <a
                  href={booking.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#0969da", textDecoration: "none" }}
                >
                  View payment receipt
                </a>
              }
            />
          ) : null}
        </div>

        {/* Refunds list (admin- or user-initiated) */}
        {refunds && refunds.length > 0 && (
          <div style={card}>
            <div style={sectionTitle}>Refunds</div>
            {refunds.map((r) => {
              const dt = new Date(r.created * 1000);
              const date = dateFmt.format(dt);
              const time = timeFmt.format(dt);
            //   const dashUrl = `https://dashboard.stripe.com/${stripeMode === "test" ? "test/" : ""}refunds/${r.id}`;
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
                    ${ (r.amount / 100).toFixed(2) } • {r.status}
                    {r.reason ? ` • ${r.reason}` : ""}
                    <div style={{ fontSize: 12, color: "#666" }}>
                      {date} {time}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      {/* <a href={dashUrl} target="_blank" rel="noreferrer" style={{ color: "#0969da" }}>
                        View in Stripe
                      </a>{" "} */}
                      {/* •{" "} */}
                      <Link href={`/receipt/refund/${r.id}`} style={{ color: "#0969da" }}>
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
        )}

        {/* Notes / timeline */}
        <div style={card}>
          <div style={sectionTitle}>Timeline</div>
          <Row label="Booked On" value={createdStr} />
          <Row label="Last Updated" value={updatedStr} />
          <div style={{ ...sectionTitle, marginTop: 12 }}>Notes</div>
          <div
            style={{
              fontSize: 14,
              padding: "6px 0",
              borderBottom: "1px solid #f5f5f5",
              whiteSpace: "pre-wrap",
            }}
          >
            {booking.notes ? booking.notes : <span style={{ color: "#666" }}>—</span>}
          </div>
        </div>

        {/* Actions */}
        <div style={card}>
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

          {/* Cancel & Refund (form+confirm) */}
          {isCanceled ? (
            <div style={{ color: "#666" }}>This booking has been canceled.</div>
          ) : (
            <>
              <form id={cancelFormId} action={cancelAndRefundSA} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input type="hidden" name="id" value={booking.id} />
                <input
                  type="text"
                  name="reason"
                  placeholder="Reason (optional)"
                  style={input}
                />
              </form>
              <ConfirmSubmit form={cancelFormId} message="Cancel this appointment and refund the client?">
                Cancel & Refund
              </ConfirmSubmit>
            </>
          )}

          {/* Complete / No-show */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            <form action={markCompletedSA}>
              <input type="hidden" name="id" value={booking.id} />
              <button type="submit" style={outlineBtn} disabled={isCanceled}>
                Mark Completed
              </button>
            </form>
            <form action={markNoShowSA}>
              <input type="hidden" name="id" value={booking.id} />
              <button type="submit" style={outlineBtn} disabled={isCanceled}>
                Mark No-Show
              </button>
            </form>
          </div>
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

/* ───────────── shared inline tokens ───────────── */
const card: React.CSSProperties = {
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
const input: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
  background: "white",
  width: 260,
};
const outlineBtn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 6,
  background: "white",
  color: "#333",
  border: "1px solid #ddd",
  cursor: "pointer",
  textDecoration: "none",
};

/* ───────────── helpers ───────────── */
function fmt(cents: number | null | undefined) {
  if (typeof cents !== "number") return "—";
  return `$${(cents / 100).toFixed(2)}`;
}
function appendNote(existing: string | null | undefined, line?: string | null) {
  const add = (line ?? "").trim();
  if (!add) return existing ?? null;
  return existing ? `${existing}\n${add}` : add;
}
