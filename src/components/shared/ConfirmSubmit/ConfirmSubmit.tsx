"use client";

import React from "react";

export default function ConfirmSubmit({
  form,
  children,
  message = "Delete this service? This cannot be undone.",
  style,
}: {
  form: string;
  children: React.ReactNode;
  message?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type='submit'
      form={form}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
      style={style ?? dangerBtn}
    >
      {children}
    </button>
  );
}

const dangerBtn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 6,
  background: "#b33636",
  color: "white",
  border: "1px solid #b33636",
  cursor: "pointer",
};
