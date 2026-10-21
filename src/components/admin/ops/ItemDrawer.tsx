"use client";

import { useCallback, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "../shell/Drawer";
import { btnGhost } from "./ui";

/** Wraps a post in the drawer/sheet; closing goes back to the page underneath (the URL stays shareable). */
export function ItemDrawer({ id, title, subtitle, badge, children }: { id: string; title: string; subtitle: string; badge: ReactNode; children: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const close = useCallback(() => {
    setOpen(false);
    router.back();
  }, [router]);
  return (
    <Drawer open={open} onClose={close} title={title} subtitle={subtitle} badge={badge} footer={<a href={`/admin/items/${id}`} className={btnGhost}>Open full page</a>}>
      {children}
    </Drawer>
  );
}

