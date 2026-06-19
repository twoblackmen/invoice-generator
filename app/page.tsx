"use client";

import { useState, useRef, useCallback } from "react";
import InvoiceForm from "./components/InvoiceForm";
import InvoicePreview from "./components/InvoicePreview";
import { InvoiceData } from "./types/invoice";

export default function Home() {
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [step, setStep] = useState<"form" | "preview">("form");

  const handleFormSubmit = useCallback((data: InvoiceData) => {
    setInvoiceData(data);
    setStep("preview");
  }, []);

  const handleBack = useCallback(() => {
    setStep("form");
  }, []);

  return (
    <main className="relative min-h-screen z-10" style={{ position: "relative", zIndex: 1 }}>
      {/* Ambient background orbs */}
      <div
        style={{
          position: "fixed",
          bottom: "-150px",
          left: "-150px",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.07) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {step === "form" ? (
          <InvoiceForm onSubmit={handleFormSubmit} />
        ) : (
          invoiceData && (
            <InvoicePreview data={invoiceData} onBack={handleBack} />
          )
        )}
      </div>
    </main>
  );
}
