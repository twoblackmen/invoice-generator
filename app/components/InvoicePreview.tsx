"use client";

import { useState, useRef, useCallback } from "react";
import {
  ArrowLeft,
  Download,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  AtSign,
} from "lucide-react";
import { InvoiceData } from "../types/invoice";

interface InvoicePreviewProps {
  data: InvoiceData;
  onBack: () => void;
}

type Status = "idle" | "downloading" | "error";
type WebhookStatus = "idle" | "sending" | "sent" | "error";

function formatNumber(amount: number): string {
  return new Intl.NumberFormat("en-NG").format(amount);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

export default function InvoicePreview({ data, onBack }: InvoicePreviewProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const items = data.items ?? [];
  const subtotal = items.reduce(
    (sum, it) => sum + it.unitPrice * it.quantity,
    0
  );
  const discountPct = data.discount ?? 0;
  const discountAmt = (subtotal * discountPct) / 100;
  const total = subtotal - discountAmt;
  const brandName = data.brandName || "Two Blackmen";
  const bankName = data.bankName || "Moniepoint";
  const accountName = data.accountName || "Two Blackmen (Gideon Akani)";
  const accountNumber = data.accountNumber || "9036329918";
  const phone = data.phone || "+234-903-632-9918";
  const whatsapp = data.whatsapp || "+234-813-253-2887";
  const emailContact = data.emailContact || "Twoblackmen23@gmail.com";
  const instagram = data.instagram || "2black_men_";
  const country = data.country || "Nigeria";

  const handleDownload = useCallback(async () => {
    if (!invoiceRef.current) return;
    setStatus("downloading");

    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: invoiceRef.current.offsetWidth,
        height: invoiceRef.current.offsetHeight,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.8);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasAspect = canvas.height / canvas.width;
      const imgHeight = pdfWidth * canvasAspect;

      if (imgHeight <= pdfHeight) {
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, imgHeight);
      } else {
        let yOffset = 0;
        while (yOffset < imgHeight) {
          if (yOffset > 0) pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, -yOffset, pdfWidth, imgHeight);
          yOffset += pdfHeight;
        }
      }

      pdf.save(`Invoice-${data.invoiceNumber}.pdf`);
      setStatus("idle");
    } catch (err) {
      console.error("PDF generation error:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }, [data.invoiceNumber]);

  const generatePdfBase64 = useCallback(async (): Promise<{ base64: string; filename: string } | null> => {
    if (!invoiceRef.current) return null;
    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");

    const canvas = await html2canvas(invoiceRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: invoiceRef.current.offsetWidth,
      height: invoiceRef.current.offsetHeight,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.8);
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = pdfWidth * (canvas.height / canvas.width);

    if (imgHeight <= pdfHeight) {
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, imgHeight);
    } else {
      let yOffset = 0;
      while (yOffset < imgHeight) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, -yOffset, pdfWidth, imgHeight);
        yOffset += pdfHeight;
      }
    }

    const filename = `Invoice-${data.invoiceNumber}.pdf`;
    const base64 = pdf.output("datauristring").split(",")[1];
    return { base64, filename };
  }, [data.invoiceNumber]);

  const handleSendInvoice = useCallback(async () => {
    setWebhookStatus("sending");
    setErrorMessage(null);

    try {
      const pdfResult = await generatePdfBase64();

      const payload = {
        invoiceNumber: data.invoiceNumber,
        clientName: `${data.firstName} ${data.lastName}`,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        companyName: data.companyName || null,
        items: data.items,
        amount: total,
        discount: discountPct,
        discountAmount: discountAmt,
        currency: "NGN",
        formattedAmount: `NGN ${formatNumber(total)}`,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        notes: data.notes || null,
        sentAt: new Date().toISOString(),
        pdf_base64: pdfResult?.base64 ?? null,
        pdf_filename: pdfResult?.filename ?? `Invoice-${data.invoiceNumber}.pdf`,
        pdf_mimetype: "application/pdf",
      };

      const res = await fetch("/api/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok) {
        setWebhookStatus("sent");
        setTimeout(() => setWebhookStatus("idle"), 5000);
      } else {
        setErrorMessage(json.error || `Request failed with status ${res.status}.`);
        setWebhookStatus("error");
        setTimeout(() => setWebhookStatus("idle"), 8000);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error — could not reach the server.";
      setErrorMessage(msg);
      setWebhookStatus("error");
      setTimeout(() => setWebhookStatus("idle"), 8000);
    }
  }, [data, generatePdfBase64, total]);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 24px 80px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "32px",
      }}
    >
      {/* Top Bar */}
      <div
        className="animate-fade-in"
        style={{
          width: "100%",
          maxWidth: "780px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <button
          id="back-btn"
          onClick={onBack}
          onMouseEnter={() => setHoveredBtn("back")}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 18px",
            background:
              hoveredBtn === "back"
                ? "rgba(255,255,255,0.08)"
                : "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            color: "#94a3b8",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s ease",
            fontFamily: "inherit",
          }}
        >
          <ArrowLeft size={16} />
          Edit Invoice
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          {/* Download Button */}
          <button
            id="download-pdf-btn"
            onClick={handleDownload}
            disabled={status === "downloading"}
            onMouseEnter={() => setHoveredBtn("download")}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "11px 20px",
              background:
                hoveredBtn === "download"
                  ? "rgba(16, 185, 129, 0.15)"
                  : "rgba(16, 185, 129, 0.08)",
              border: "1.5px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "10px",
              color: "#10b981",
              fontSize: "14px",
              fontWeight: 600,
              cursor: status === "downloading" ? "wait" : "pointer",
              transition: "all 0.2s ease",
              transform:
                hoveredBtn === "download" ? "translateY(-1px)" : "translateY(0)",
              fontFamily: "inherit",
              opacity: status === "downloading" ? 0.7 : 1,
            }}
          >
            {status === "downloading" ? (
              <>
                <Loader2 size={16} style={{ animation: "spin-slow 1s linear infinite" }} />
                Generating...
              </>
            ) : (
              <>
                <Download size={16} />
                Download PDF
              </>
            )}
          </button>

          {/* Send Button */}
          <button
            id="send-invoice-btn"
            onClick={handleSendInvoice}
            disabled={webhookStatus === "sending"}
            onMouseEnter={() => setHoveredBtn("send")}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "11px 22px",
              background:
                webhookStatus === "sent"
                  ? "linear-gradient(135deg, #10b981, #059669)"
                  : webhookStatus === "error"
                    ? "linear-gradient(135deg, #f43f5e, #e11d48)"
                    : hoveredBtn === "send"
                      ? "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #0891b2 100%)"
                      : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)",
              border: "none",
              borderRadius: "10px",
              color: "white",
              fontSize: "14px",
              fontWeight: 700,
              cursor: webhookStatus === "sending" ? "wait" : "pointer",
              transition: "all 0.3s ease",
              transform:
                hoveredBtn === "send" ? "translateY(-1px)" : "translateY(0)",
              boxShadow:
                webhookStatus === "sent"
                  ? "0 8px 20px rgba(16, 185, 129, 0.3)"
                  : hoveredBtn === "send"
                    ? "0 12px 28px rgba(99, 102, 241, 0.4)"
                    : "0 4px 16px rgba(99, 102, 241, 0.25)",
              fontFamily: "inherit",
              minWidth: "150px",
              justifyContent: "center",
            }}
          >
            {webhookStatus === "sending" ? (
              <>
                <Loader2 size={16} style={{ animation: "spin-slow 1s linear infinite" }} />
                Sending...
              </>
            ) : webhookStatus === "sent" ? (
              <>
                <CheckCircle2 size={16} />
                Invoice Sent!
              </>
            ) : webhookStatus === "error" ? (
              <>
                <AlertCircle size={16} />
                Retry Send
              </>
            ) : (
              <>
                <Send size={16} />
                Send Invoice
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success notification */}
      {webhookStatus === "sent" && (
        <div
          className="animate-success-pop"
          style={{
            width: "100%",
            maxWidth: "780px",
            padding: "14px 20px",
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            color: "#10b981",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "rgba(16, 185, 129, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: "14px" }}>
              Invoice sent successfully!
            </p>
            <p style={{ fontSize: "12px", opacity: 0.8, marginTop: "2px" }}>
              Your n8n workflow has been triggered. Check your automation for next steps.
            </p>
          </div>
        </div>
      )}

      {/* Error notification */}
      {webhookStatus === "error" && errorMessage && (
        <div
          className="animate-success-pop"
          style={{
            width: "100%",
            maxWidth: "780px",
            padding: "14px 20px",
            background: "rgba(244, 63, 94, 0.08)",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            color: "#f43f5e",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "rgba(244, 63, 94, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: "1px",
            }}
          >
            <AlertCircle size={18} />
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: "14px" }}>Failed to send invoice</p>
            <p style={{ fontSize: "12px", opacity: 0.85, marginTop: "4px", lineHeight: 1.6 }}>
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* Invoice Document */}
      <div
        className="animate-fade-in-up"
        style={{
          width: "100%",
          maxWidth: "780px",
          borderRadius: "4px",
          overflow: "hidden",
          boxShadow:
            "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
          animationDelay: "0.15s",
          opacity: 0,
          animationFillMode: "forwards",
        }}
      >
        {/* Printable invoice — white background for PDF */}
        <div
          ref={invoiceRef}
          id="invoice-document"
          style={{
            background: "#ffffff",
            color: "#1a1a1a",
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            padding: "0",
            minHeight: "1000px",
            position: "relative",
          }}
        >
          {/* ── HEADER with wave ── */}
          <div
            style={{
              position: "relative",
              background: "#ffffff",
              height: "160px",
              overflow: "hidden",
            }}
          >
            {/* SVG wave that curves from dark to white */}
            <svg
              viewBox="0 0 800 160"
              preserveAspectRatio="none"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
              }}
            >
              {/* Lighter grey wave for depth */}
              <path
                d="M0,0 L800,0 L800,60 C550,60 450,160 250,160 C120,160 50,150 0,150 Z"
                fill="#444444"
              />
              {/* Main Dark wave */}
              <path
                d="M0,0 L800,0 L800,40 C550,40 450,140 250,140 C120,140 50,130 0,130 Z"
                fill="#3a3a3a"
              />
            </svg>

            {/* Logo / Brand name — left */}
            <div
              style={{
                position: "absolute",
                left: "40px",
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                zIndex: 2,
              }}
            >
              {/* Logo image from /public */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt={brandName}
                style={{
                  height: "60px",
                  width: "auto",
                  objectFit: "contain",
                  flexShrink: 0,
                  mixBlendMode: "screen",
                }}
              />
              <span
                style={{
                  color: "white",
                  fontSize: "20px",
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                {brandName}
              </span>
            </div>

            {/* INVOICE text — right side, in the white area */}
            <div
              style={{
                position: "absolute",
                right: "40px",
                bottom: "20px",
                zIndex: 2,
              }}
            >
              <span
                style={{
                  fontSize: "48px",
                  fontWeight: 300,
                  letterSpacing: "0.18em",
                  color: "#3a3a3a",
                  textTransform: "uppercase",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                INVOICE
              </span>
            </div>
          </div>

          {/* ── BODY ── */}
          <div style={{ padding: "40px 48px 0" }}>

            {/* Meta row: ISSUED TO | INVOICE NO */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "32px",
                marginBottom: "32px",
              }}
            >
              {/* Left: Issued To */}
              <div>
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#1a1a1a",
                    marginBottom: "6px",
                  }}
                >
                  ISSUED TO:
                </p>
                <p style={{ fontSize: "14px", color: "#333" }}>
                  Name:{data.firstName} {data.lastName}
                </p>
                {data.companyName && (
                  <p style={{ fontSize: "14px", color: "#555", marginTop: "2px" }}>
                    {data.companyName}
                  </p>
                )}
              </div>

              {/* Right: Invoice meta */}
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto auto",
                    gap: "2px 16px",
                    justifyContent: "end",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "#1a1a1a",
                      textAlign: "right",
                    }}
                  >
                    INVOICE NO:
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a" }}>
                    {data.invoiceNumber}
                  </span>

                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#777",
                      textAlign: "right",
                    }}
                  >
                    DATE:
                  </span>
                  <span style={{ fontSize: "14px", color: "#333" }}>
                    {formatDate(data.issueDate)}
                  </span>

                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#777",
                      textAlign: "right",
                    }}
                  >
                    DUE DATE:
                  </span>
                  <span style={{ fontSize: "14px", color: "#333" }}>
                    {formatDate(data.dueDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Pay To */}
            <div style={{ marginBottom: "36px" }}>
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#1a1a1a",
                  marginBottom: "8px",
                }}
              >
                PAY TO:
              </p>
              {bankName && (
                <p style={{ fontSize: "14px", color: "#333", lineHeight: 1.8 }}>
                  Bank: {bankName}
                </p>
              )}
              {accountName && (
                <p style={{ fontSize: "14px", color: "#333", lineHeight: 1.8 }}>
                  Account Name: {accountName}
                </p>
              )}
              {accountNumber && (
                <p style={{ fontSize: "14px", color: "#333", lineHeight: 1.8 }}>
                  Account No.: {accountNumber}
                </p>
              )}
            </div>

            {/* ── Items Table ── */}
            <div style={{ marginBottom: "0" }}>
              {/* Table header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 80px 1fr",
                  gap: "8px",
                  paddingBottom: "10px",
                  borderBottom: "1.5px solid #1a1a1a",
                  marginBottom: "0",
                }}
              >
                {["DESCRIPTION", "UNIT PRICE", "QTY", "TOTAL"].map((h, i) => (
                  <p
                    key={h}
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "#1a1a1a",
                      textAlign: i === 0 ? "left" : "right",
                    }}
                  >
                    {h}
                  </p>
                ))}
              </div>

              {/* Line items — one row per item */}
              {items.map((it, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 80px 1fr",
                    gap: "8px",
                    padding: "16px 0",
                    borderBottom: "1px solid #e5e5e5",
                  }}
                >
                  <p style={{ fontSize: "14px", color: "#333" }}>
                    {it.description}
                  </p>
                  <p style={{ fontSize: "14px", color: "#333", textAlign: "right" }}>
                    {formatNumber(it.unitPrice)}
                  </p>
                  <p style={{ fontSize: "14px", color: "#333", textAlign: "right" }}>
                    {it.quantity}
                  </p>
                  <p style={{ fontSize: "14px", color: "#333", textAlign: "right" }}>
                    {formatNumber(it.unitPrice * it.quantity)}
                  </p>
                </div>
              ))}

              {/* Spacer */}
              <div style={{ height: items.length > 3 ? "20px" : "60px" }} />
            </div>
          </div>

          {/* ── Totals + Footer ── */}
          <div style={{ padding: "0 48px 32px" }}>
            {/* Divider */}
            <div style={{ borderTop: "1.5px solid #1a1a1a", marginBottom: "20px" }} />

            {/* Totals row */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: "40px",
              }}
            >
              {/* Right: Subtotal / Discount / Total */}
              <div style={{ textAlign: "right", minWidth: "250px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "32px",
                    marginBottom: "6px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#1a1a1a",
                    }}
                  >
                    SUBTOTAL
                  </span>
                  <span style={{ fontSize: "13px", color: "#333" }}>
                    NGN {formatNumber(subtotal)}
                  </span>
                </div>

                {discountPct > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "16px",
                      marginBottom: "10px",
                    }}
                  >
                    <span style={{ fontSize: "13px", color: "#555" }}>Discount ({discountPct}%)</span>
                    <span style={{ fontSize: "13px", color: "#555" }}>
                      - NGN {formatNumber(discountAmt)}
                    </span>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: "16px",
                    paddingTop: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: 800,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "#1a1a1a",
                    }}
                  >
                    TOTAL
                  </span>
                  <span
                    style={{
                      fontSize: "24px",
                      fontWeight: 800,
                      color: "#1a1a1a",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {formatNumber(total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Regards & Signature row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                flexWrap: "wrap",
                gap: "24px",
              }}
            >
              {/* Left: Regards */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "#1a1a1a",
                  }}
                >
                  REGARDS, {brandName === "Two Blackmen" ? "2BM" : brandName.split(" ").map(w => w[0]).join("").slice(0, 3)}🌹
                </span>
              </div>

              {/* Signature area */}
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  alignItems: "flex-end",
                  paddingBottom: "4px",
                }}
              >
                {/* Sig 1 */}
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontFamily: "'Dancing Script', 'Brush Script MT', cursive",
                      fontSize: "26px",
                      color: "#555",
                      lineHeight: 1,
                      marginBottom: "4px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Gideon
                  </div>
                  <div
                    style={{
                      width: "90px",
                      borderBottom: "1.5px solid #999",
                    }}
                  />
                </div>
                {/* Sig 2 */}
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontFamily: "'Dancing Script', 'Brush Script MT', cursive",
                      fontSize: "26px",
                      color: "#555",
                      lineHeight: 1,
                      marginBottom: "4px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Akani
                  </div>
                  <div
                    style={{
                      width: "90px",
                      borderBottom: "1.5px solid #999",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Country */}
            {country && (
              <p
                style={{
                  fontSize: "13px",
                  color: "#555",
                  marginTop: "24px",
                  marginBottom: "0",
                }}
              >
                {country}.
              </p>
            )}
          </div>

          {/* ── Contact Footer Bar ── */}
          <div
            style={{
              borderTop: "1px solid #ddd",
              padding: "14px 48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              background: "#fafafa",
            }}
          >
            {/* Phone */}
            {phone && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Phone size={13} color="#555" />
                <span style={{ fontSize: "12px", color: "#555" }}>{phone}</span>
              </div>
            )}
            {/* WhatsApp */}
            {whatsapp && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {/* WhatsApp icon */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#555">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span style={{ fontSize: "12px", color: "#555" }}>{whatsapp}</span>
              </div>
            )}
            {/* Email */}
            {emailContact && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Mail size={13} color="#555" />
                <span style={{ fontSize: "12px", color: "#555" }}>{emailContact}</span>
              </div>
            )}
            {/* Instagram */}
            {instagram && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <AtSign size={13} color="#555" />
                <span style={{ fontSize: "12px", color: "#555" }}>{instagram}</span>
              </div>
            )}
          </div>
        </div>
      </div>



    </div>
  );
}
