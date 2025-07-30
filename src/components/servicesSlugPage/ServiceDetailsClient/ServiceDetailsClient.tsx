"use client";

import { services } from "@/data";
import ServicesDetailPageIntro from "../ServicesDetailPageIntro/ServicesDetailPageIntro";

/** Exact, readonly type derived from your data */
type Service = (typeof services)[number];

export default function ServiceDetailsClient({
  service,
}: {
  service: Service;
}) {
  return (
    <main>
      <ServicesDetailPageIntro service={service} />
      <h3 style={{ textAlign: "center", margin: "2rem", color: "var(--blue)" }}>
        More details coming soon!
      </h3>
    </main>
  );
}
