"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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

/* ─── A4 dimensions at 96 dpi ─── */
const A4_W = 680;
const A4_H = Math.round(A4_W * 297 / 210); // 961 px — exactly one A4 page

export default function InvoicePreview({ data, onBack }: InvoicePreviewProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [webhookStatus, setWebhookStatus] = useState<WebhookStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);     // measures available width
  const scaleShellRef = useRef<HTMLDivElement>(null); // the transform:scale() div
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  const items = data.items ?? [];
  const subtotal = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  const discountPct = data.discount ?? 0;
  const discountAmt = (subtotal * discountPct) / 100;
  const total = subtotal - discountAmt;

  /* defaults */
  const brandName     = data.brandName     || "Two Blackmen";
  const bankName      = data.bankName      || "Moniepoint";
  const accountName   = data.accountName   || "Two Blackmen (Gideon Akani)";
  const accountNumber = data.accountNumber || "9036329918";
  const phone         = data.phone         || "+234-903-632-9918";
  const whatsapp      = data.whatsapp      || "+234-813-253-2887";
  const emailContact  = data.emailContact  || "Twoblackmen23@gmail.com";
  const instagram     = data.instagram     || "2black_men_";
  const country       = data.country       || "Nigeria";

  /* ── Scale invoice to fit the available container width ── */
  useEffect(() => {
    function recalc() {
      if (!outerRef.current) return;
      setScale(Math.min(1, outerRef.current.clientWidth / A4_W));
    }
    recalc();
    const ro = new ResizeObserver(recalc);
    if (outerRef.current) ro.observe(outerRef.current);
    return () => ro.disconnect();
  }, []);

  /* ── Capture helpers ──
     html2canvas reads getBoundingClientRect(), which returns scaled
     dimensions when a parent has transform:scale(). We temporarily
     reset the shell to scale(1) so the capture sees the true A4 size. */
  async function captureCanvas() {
    if (!invoiceRef.current) return null;
    const { default: html2canvas } = await import("html2canvas");

    const shell = scaleShellRef.current;
    if (shell) shell.style.transform = "scale(1)";

    try {
      return await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: A4_W,
        height: A4_H,
        windowWidth: A4_W + 80,
        windowHeight: A4_H + 80,
      });
    } finally {
      /* Always restore the visual scale */
      if (shell) shell.style.transform = `scale(${scale})`;
    }
  }

  const handleDownload = useCallback(async () => {
    setStatus("downloading");
    try {
      const { default: jsPDF } = await import("jspdf");
      const canvas = await captureCanvas();
      if (!canvas) throw new Error("capture failed");

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pw = pdf.internal.pageSize.getWidth();   // 210 mm
      const ph = pdf.internal.pageSize.getHeight();  // 297 mm

      /* The canvas aspect matches A4 exactly → always one page */
      const ih = pw * (canvas.height / canvas.width);
      pdf.addImage(imgData, "JPEG", 0, 0, pw, Math.min(ih, ph));
      pdf.save(`Invoice-${data.invoiceNumber}.pdf`);
      setStatus("idle");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.invoiceNumber]);

  const generatePdfBase64 = useCallback(async (): Promise<{ base64: string; filename: string } | null> => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const canvas = await captureCanvas();
      if (!canvas) return null;

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const ih = pw * (canvas.height / canvas.width);
      pdf.addImage(imgData, "JPEG", 0, 0, pw, Math.min(ih, ph));

      const filename = `Invoice-${data.invoiceNumber}.pdf`;
      const base64 = pdf.output("datauristring").split(",")[1];
      return { base64, filename };
    } catch {
      return null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.invoiceNumber]);

  const handleSendInvoice = useCallback(async () => {
    setWebhookStatus("sending");
    setErrorMessage(null);
    try {
      const pdfResult = await generatePdfBase64();
      const payload = {
        invoiceNumber: data.invoiceNumber,
        clientName: `${data.firstName} ${data.lastName}`,
        firstName: data.firstName, lastName: data.lastName,
        email: data.email, companyName: data.companyName || null,
        items: data.items, amount: total, discount: discountPct,
        discountAmount: discountAmt, currency: "NGN",
        formattedAmount: `NGN ${formatNumber(total)}`,
        issueDate: data.issueDate, dueDate: data.dueDate,
        notes: data.notes || null, sentAt: new Date().toISOString(),
        pdf_base64: pdfResult?.base64 ?? null,
        pdf_filename: pdfResult?.filename ?? `Invoice-${data.invoiceNumber}.pdf`,
        pdf_mimetype: "application/pdf",
      };
      const res = await fetch("/api/send-invoice", {
        method: "POST", headers: { "Content-Type": "application/json" },
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
      const msg = err instanceof Error ? err.message : "Network error.";
      setErrorMessage(msg);
      setWebhookStatus("error");
      setTimeout(() => setWebhookStatus("idle"), 8000);
    }
  }, [data, generatePdfBase64, total, discountPct, discountAmt]);

  /* ═══════════════════════════════ RENDER ══════════════════════════════ */
  return (
    <div
      className="preview-outer-padding"
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}
    >
      {/* ── Top bar ── */}
      <div className="animate-fade-in preview-top-bar">
        <button
          id="back-btn"
          onClick={onBack}
          onMouseEnter={() => setHoveredBtn("back")}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px",
            background: hoveredBtn === "back" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px",
            color: "#94a3b8", fontSize: "14px", fontWeight: 500, cursor: "pointer",
            transition: "all 0.2s ease", fontFamily: "inherit",
          }}
        >
          <ArrowLeft size={16} />Edit Invoice
        </button>

        <div className="preview-actions">
          <button
            id="download-pdf-btn"
            onClick={handleDownload}
            disabled={status === "downloading"}
            onMouseEnter={() => setHoveredBtn("dl")}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "11px 20px",
              background: hoveredBtn === "dl" ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.08)",
              border: "1.5px solid rgba(16,185,129,0.3)", borderRadius: "10px",
              color: "#10b981", fontSize: "14px", fontWeight: 600, fontFamily: "inherit",
              cursor: status === "downloading" ? "wait" : "pointer",
              transition: "all 0.2s ease",
              transform: hoveredBtn === "dl" ? "translateY(-1px)" : "none",
              opacity: status === "downloading" ? 0.7 : 1,
            }}
          >
            {status === "downloading"
              ? <><Loader2 size={16} style={{ animation: "spin-slow 1s linear infinite" }} />Generating...</>
              : <><Download size={16} />Download PDF</>}
          </button>

          <button
            id="send-invoice-btn"
            onClick={handleSendInvoice}
            disabled={webhookStatus === "sending"}
            onMouseEnter={() => setHoveredBtn("send")}
            onMouseLeave={() => setHoveredBtn(null)}
            style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "11px 22px",
              background: webhookStatus === "sent"
                ? "linear-gradient(135deg,#10b981,#059669)"
                : webhookStatus === "error"
                  ? "linear-gradient(135deg,#f43f5e,#e11d48)"
                  : hoveredBtn === "send"
                    ? "linear-gradient(135deg,#4f46e5,#7c3aed,#0891b2)"
                    : "linear-gradient(135deg,#6366f1,#8b5cf6,#06b6d4)",
              border: "none", borderRadius: "10px", color: "white",
              fontSize: "14px", fontWeight: 700, fontFamily: "inherit",
              cursor: webhookStatus === "sending" ? "wait" : "pointer",
              transition: "all 0.3s ease",
              transform: hoveredBtn === "send" ? "translateY(-1px)" : "none",
              boxShadow: hoveredBtn === "send" ? "0 12px 28px rgba(99,102,241,0.4)" : "0 4px 16px rgba(99,102,241,0.25)",
              minWidth: "140px", justifyContent: "center",
            }}
          >
            {webhookStatus === "sending"
              ? <><Loader2 size={16} style={{ animation: "spin-slow 1s linear infinite" }} />Sending...</>
              : webhookStatus === "sent" ? <><CheckCircle2 size={16} />Invoice Sent!</>
              : webhookStatus === "error" ? <><AlertCircle size={16} />Retry Send</>
              : <><Send size={16} />Send Invoice</>}
          </button>
        </div>
      </div>

      {/* notifications */}
      {webhookStatus === "sent" && (
        <div className="animate-success-pop" style={{ width:"100%",maxWidth:`${A4_W}px`,padding:"14px 20px",background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:"12px",display:"flex",alignItems:"center",gap:"12px",color:"#10b981" }}>
          <div style={{ width:"32px",height:"32px",borderRadius:"50%",background:"rgba(16,185,129,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}><CheckCircle2 size={18}/></div>
          <div><p style={{fontWeight:600,fontSize:"14px"}}>Invoice sent!</p><p style={{fontSize:"12px",opacity:0.8,marginTop:"2px"}}>n8n workflow triggered.</p></div>
        </div>
      )}
      {webhookStatus === "error" && errorMessage && (
        <div className="animate-success-pop" style={{ width:"100%",maxWidth:`${A4_W}px`,padding:"14px 20px",background:"rgba(244,63,94,0.08)",border:"1px solid rgba(244,63,94,0.3)",borderRadius:"12px",display:"flex",alignItems:"flex-start",gap:"12px",color:"#f43f5e" }}>
          <div style={{ width:"32px",height:"32px",borderRadius:"50%",background:"rgba(244,63,94,0.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"1px" }}><AlertCircle size={18}/></div>
          <div><p style={{fontWeight:600,fontSize:"14px"}}>Failed to send invoice</p><p style={{fontSize:"12px",opacity:0.85,marginTop:"4px",lineHeight:1.6}}>{errorMessage}</p></div>
        </div>
      )}

      {/* ── Outer measurement wrapper ──
          outerRef measures the available width.
          The invoice inside is always A4_W px wide and A4_H px tall,
          then scaled down via CSS transform to fit.                  */}
      <div
        ref={outerRef}
        className="animate-fade-in-up"
        style={{
          width: "100%",
          maxWidth: `${A4_W}px`,
          /* scaled height so the page doesn't leave a gap */
          height: `${A4_H * scale}px`,
          animationDelay: "0.15s",
          opacity: 0,
          animationFillMode: "forwards",
          boxShadow: "0 32px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.07)",
          borderRadius: "3px",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* ── Scale shell ── */}
        <div ref={scaleShellRef} style={{ width: `${A4_W}px`, transformOrigin: "top left", transform: `scale(${scale})` }}>

          {/* ════════════════ PRINTABLE INVOICE ════════════════
              Exactly A4_W × A4_H px — always one PDF page.
              Uses flex-column so the spacer auto-fills whitespace. */}
          <div
            ref={invoiceRef}
            id="invoice-document"
            style={{
              width: `${A4_W}px`,
              height: `${A4_H}px`,
              background: "#ffffff",
              color: "#1a1a1a",
              fontFamily: "'Inter','Helvetica Neue',Arial,sans-serif",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >

            {/* ── HEADER WAVE ── fixed 115 px tall */}
            <div style={{ position:"relative", height:"115px", flexShrink:0, overflow:"hidden", background:"#ffffff" }}>
              <svg viewBox="0 0 800 115" preserveAspectRatio="none"
                style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}>
                <path d="M0,0 L800,0 L800,40 C550,40 450,115 250,115 C120,115 50,108 0,108 Z" fill="#444444"/>
                <path d="M0,0 L800,0 L800,26 C550,26 450,100 250,100 C120,100 50,93 0,93 Z" fill="#3a3a3a"/>
              </svg>
              {/* Brand — left */}
              <div style={{ position:"absolute", left:"28px", top:"50%", transform:"translateY(-58%)", display:"flex", alignItems:"center", gap:"10px", zIndex:2 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt={brandName}
                  style={{ height:"42px", width:"auto", objectFit:"contain", flexShrink:0, mixBlendMode:"screen" }}/>
                <span style={{ color:"white", fontSize:"15px", fontWeight:800, letterSpacing:"0.05em", textTransform:"uppercase" }}>
                  {brandName}
                </span>
              </div>
              {/* INVOICE label — right */}
              <div style={{ position:"absolute", right:"28px", bottom:"10px", zIndex:2 }}>
                <span style={{ fontSize:"34px", fontWeight:300, letterSpacing:"0.18em", color:"#3a3a3a", textTransform:"uppercase" }}>
                  INVOICE
                </span>
              </div>
            </div>

            {/* ── BODY (scrollable flex column) ── */}
            <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"20px 32px 0", overflow:"hidden" }}>

              {/* Meta: ISSUED TO | INVOICE NO */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"16px" }}>
                <div>
                  <p style={{ fontSize:"8px", fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase", color:"#1a1a1a", marginBottom:"4px" }}>ISSUED TO:</p>
                  <p style={{ fontSize:"11px", color:"#333" }}>Name:{data.firstName} {data.lastName}</p>
                  {data.companyName && <p style={{ fontSize:"11px", color:"#555", marginTop:"2px" }}>{data.companyName}</p>}
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"auto auto", gap:"2px 10px", justifyContent:"end", alignItems:"center" }}>
                    <span style={{ fontSize:"8px", fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", color:"#1a1a1a", textAlign:"right" }}>INVOICE NO:</span>
                    <span style={{ fontSize:"11px", fontWeight:700, color:"#1a1a1a" }}>{data.invoiceNumber}</span>
                    <span style={{ fontSize:"8px", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"#777", textAlign:"right" }}>DATE:</span>
                    <span style={{ fontSize:"11px", color:"#333" }}>{formatDate(data.issueDate)}</span>
                    <span style={{ fontSize:"8px", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"#777", textAlign:"right" }}>DUE DATE:</span>
                    <span style={{ fontSize:"11px", color:"#333" }}>{formatDate(data.dueDate)}</span>
                  </div>
                </div>
              </div>

              {/* PAY TO */}
              <div style={{ marginBottom:"16px" }}>
                <p style={{ fontSize:"8px", fontWeight:800, letterSpacing:"0.12em", textTransform:"uppercase", color:"#1a1a1a", marginBottom:"5px" }}>PAY TO:</p>
                {bankName      && <p style={{ fontSize:"11px", color:"#333", lineHeight:1.65 }}>Bank: {bankName}</p>}
                {accountName   && <p style={{ fontSize:"11px", color:"#333", lineHeight:1.65 }}>Account Name: {accountName}</p>}
                {accountNumber && <p style={{ fontSize:"11px", color:"#333", lineHeight:1.65 }}>Account No.: {accountNumber}</p>}
              </div>

              {/* Items table */}
              <div>
                <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 52px 1fr", gap:"6px", paddingBottom:"7px", borderBottom:"1.5px solid #1a1a1a" }}>
                  {["DESCRIPTION","UNIT PRICE","QTY","TOTAL"].map((h,i) => (
                    <p key={h} style={{ fontSize:"8px", fontWeight:800, letterSpacing:"0.1em", textTransform:"uppercase", color:"#1a1a1a", textAlign: i===0?"left":"right" }}>{h}</p>
                  ))}
                </div>
                {items.map((it, i) => (
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"2fr 1fr 52px 1fr", gap:"6px", padding:"8px 0", borderBottom:"1px solid #e5e5e5" }}>
                    <p style={{ fontSize:"11px", color:"#333" }}>{it.description}</p>
                    <p style={{ fontSize:"11px", color:"#333", textAlign:"right" }}>{formatNumber(it.unitPrice)}</p>
                    <p style={{ fontSize:"11px", color:"#333", textAlign:"right" }}>{it.quantity}</p>
                    <p style={{ fontSize:"11px", color:"#333", textAlign:"right" }}>{formatNumber(it.unitPrice * it.quantity)}</p>
                  </div>
                ))}
              </div>

              {/* ── Flexible spacer — fills the empty page area (matches screenshot whitespace) ── */}
              <div style={{ flex:1 }} />

            </div>

            {/* ── TOTALS + SIGNATURE — pinned to bottom ── */}
            <div style={{ padding:"0 32px 14px", flexShrink:0 }}>
              <div style={{ borderTop:"1.5px solid #1a1a1a", marginBottom:"12px" }}/>

              {/* Totals — right aligned */}
              <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"18px" }}>
                <div style={{ textAlign:"right", minWidth:"200px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", gap:"28px", marginBottom:"4px" }}>
                    <span style={{ fontSize:"9px", fontWeight:800, letterSpacing:"0.08em", textTransform:"uppercase", color:"#1a1a1a" }}>SUBTOTAL</span>
                    <span style={{ fontSize:"10px", color:"#333" }}>NGN {formatNumber(subtotal)}</span>
                  </div>
                  {discountPct > 0 && (
                    <div style={{ display:"flex", justifyContent:"space-between", gap:"14px", marginBottom:"8px" }}>
                      <span style={{ fontSize:"10px", color:"#555" }}>Discount ({discountPct}%)</span>
                      <span style={{ fontSize:"10px", color:"#555" }}>- NGN {formatNumber(discountAmt)}</span>
                    </div>
                  )}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:"14px" }}>
                    <span style={{ fontSize:"12px", fontWeight:800, letterSpacing:"0.06em", textTransform:"uppercase", color:"#1a1a1a" }}>TOTAL</span>
                    <span style={{ fontSize:"18px", fontWeight:800, color:"#1a1a1a", letterSpacing:"-0.02em" }}>{formatNumber(total)}</span>
                  </div>
                </div>
              </div>

              {/* Regards + Signatures */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", gap:"12px" }}>
                <span style={{ fontSize:"13px", fontWeight:800, letterSpacing:"0.06em", textTransform:"uppercase", color:"#1a1a1a" }}>
                  REGARDS, {brandName === "Two Blackmen" ? "2BM" : brandName.split(" ").map(w => w[0]).join("").slice(0,3)}🌹
                </span>
                <div style={{ display:"flex", gap:"14px", alignItems:"flex-end" }}>
                  {["Gideon","Akani"].map(name => (
                    <div key={name} style={{ textAlign:"center" }}>
                      <div style={{ fontFamily:"'Dancing Script','Brush Script MT',cursive", fontSize:"20px", color:"#555", lineHeight:1, marginBottom:"3px", whiteSpace:"nowrap" }}>{name}</div>
                      <div style={{ width:"72px", borderBottom:"1.5px solid #999" }}/>
                    </div>
                  ))}
                </div>
              </div>

              {country && <p style={{ fontSize:"10px", color:"#555", marginTop:"10px" }}>{country}.</p>}
            </div>

            {/* ── CONTACT FOOTER BAR — always at bottom ── */}
            <div style={{ flexShrink:0, borderTop:"1px solid #ddd", padding:"8px 32px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"6px", background:"#fafafa" }}>
              {phone && (
                <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                  <Phone size={10} color="#555"/>
                  <span style={{ fontSize:"9px", color:"#555" }}>{phone}</span>
                </div>
              )}
              {whatsapp && (
                <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#555">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span style={{ fontSize:"9px", color:"#555" }}>{whatsapp}</span>
                </div>
              )}
              {emailContact && (
                <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                  <Mail size={10} color="#555"/>
                  <span style={{ fontSize:"9px", color:"#555" }}>{emailContact}</span>
                </div>
              )}
              {instagram && (
                <div style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                  <AtSign size={10} color="#555"/>
                  <span style={{ fontSize:"9px", color:"#555" }}>{instagram}</span>
                </div>
              )}
            </div>

          </div>
          {/* ════════════════ END PRINTABLE INVOICE ════════════════ */}
        </div>
      </div>

    </div>
  );
}
