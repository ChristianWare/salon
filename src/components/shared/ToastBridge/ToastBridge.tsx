// src/components/shared/ToastBridge/ToastBridge.tsx
"use client";

import { useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";

export default function ToastBridge({ toastKey }: { toastKey?: string }) {
  useEffect(() => {
    if (!toastKey) return;
    // Map toast keys to messages
    if (toastKey === "settings_saved") toast.success("Settings saved");
    else if (toastKey === "template_saved") toast.success("Template saved");
    else if (toastKey === "blackout_added")
      toast.success("Blackout date added");
    else if (toastKey === "blackout_removed")
      toast.success("Blackout date removed");
  }, [toastKey]);

  // If your app already renders a <Toaster /> globally, you can remove this line.
  return <Toaster position='top-right' />;
}
