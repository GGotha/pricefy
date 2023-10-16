"use client";

import Home from "@/templates/Home";
import { SnackbarProvider } from "notistack";

export default function Page() {
  return (
    <>
      <SnackbarProvider
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      />
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <Home />
      </main>
    </>
  );
}
