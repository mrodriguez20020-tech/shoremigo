"use client";

import { useEffect } from "react";
import { recordProof, type ProofEvent } from "@/lib/client/proof";

/** Lets server-rendered pages log the evidence they computed (e.g. a LastBoard result) once on mount. */
export function ProofOnMount({ event }: { event: Omit<ProofEvent, "id" | "at"> }) {
  const key = JSON.stringify(event);
  useEffect(() => {
    recordProof(event);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}
