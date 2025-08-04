import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function BookingPage() {
  // 1. Admin guard
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // 2. Fetch all bookings with relations
  const bookings = await db.booking.findMany({
    orderBy: { start: "desc" },
    include: { user: true, groomer: true, service: true },
  });

  return (
    <section className='p-6'>
      <h1 className='text-2xl font-bold mb-4'>All Bookings</h1>
      <div className='overflow-x-auto'>
        <table className='min-w-full bg-white border'>
          <thead>
            <tr>
              <th className='px-4 py-2 border'>Date</th>
              <th className='px-4 py-2 border'>Time</th>
              <th className='px-4 py-2 border'>Customer</th>
              <th className='px-4 py-2 border'>Groomer</th>
              <th className='px-4 py-2 border'>Service</th>
              <th className='px-4 py-2 border'>Status</th>
              <th className='px-4 py-2 border'>Details</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => {
              const dt = new Date(b.start);
              const date = dt.toLocaleDateString();
              const time = dt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <tr key={b.id}>
                  <td className='px-4 py-2 border'>{date}</td>
                  <td className='px-4 py-2 border'>{time}</td>
                  <td className='px-4 py-2 border'>
                    {b.user.name ?? b.user.email}
                  </td>
                  <td className='px-4 py-2 border'>{b.groomer.name}</td>
                  <td className='px-4 py-2 border'>{b.service.name}</td>
                  <td className='px-4 py-2 border'>{b.status}</td>
                  <td className='px-4 py-2 border'>
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className='text-blue-600 hover:underline'
                    >
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
