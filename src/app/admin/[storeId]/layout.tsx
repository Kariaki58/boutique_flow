
"use client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // NOTE: `/admin/layout.tsx` already provides the full admin shell (nav + container).
  // This nested layout should only exist for store-scoped logic, not duplicate the UI shell.
  return children;
}
