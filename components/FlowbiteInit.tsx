"use client";

import { useEffect } from "react";

/** Menginisialisasi komponen JS Flowbite (collapse navbar, dll). */
export default function FlowbiteInit() {
  useEffect(() => {
    import("flowbite").then(({ initFlowbite }) => initFlowbite());
  }, []);
  return null;
}
