import { AdminItems } from "@/components/admin/admin-items";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin \u00B7 Manage",
  robots: "noindex, nofollow",
};

export default function AdminItemsPage() {
  return <AdminItems />;
}
