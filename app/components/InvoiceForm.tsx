"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Building2,
  Hash,
  Calendar,
  Clock,
  FileText,
  MessageSquare,
  ArrowRight,
  Lock,
  Landmark,
  CreditCard,
  Phone,
  AtSign,
  Package,
  Percent,
  Tag,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { InvoiceData, InvoiceItem } from "../types/invoice";

interface InvoiceFormProps {
  onSubmit: (data: InvoiceData) => void;
}

function generateInvoiceNumber(): string {
  const num = Math.floor(Math.random() * 9000 + 1000);
  return String(num).padStart(4, "0");
}

function formatDateInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

/* ─────────────────────────────── shared UI ─────────────────────────────── */

interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  icon: React.ReactNode;
  hint?: string;
  prefix?: string;
}

function InputField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  icon,
  hint,
  prefix,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label
        htmlFor={id}
        style={{
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: focused ? "#6366f1" : "#94a3b8",
          transition: "color 0.2s ease",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", opacity: 0.8 }}>
          {icon}
        </span>
        {label}
        {required && (
          <span style={{ color: "#f43f5e", marginLeft: "2px" }}>*</span>
        )}
      </label>
      <div style={{ position: "relative" }}>
        {prefix && (
          <div
            style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              color: focused ? "#6366f1" : "#475569",
              fontWeight: 700,
              fontSize: "15px",
              transition: "color 0.2s ease",
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            {prefix}
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          required={required}
          style={{
            width: "100%",
            padding: prefix ? "14px 16px 14px 36px" : "14px 16px",
            background: focused
              ? "rgba(99, 102, 241, 0.06)"
              : "rgba(255, 255, 255, 0.03)",
            border: `1.5px solid ${focused ? "rgba(99, 102, 241, 0.5)" : "rgba(255, 255, 255, 0.08)"
              }`,
            borderRadius: "12px",
            color: "#f1f5f9",
            fontSize: "15px",
            fontFamily: "inherit",
            outline: "none",
            transition: "all 0.2s ease",
            boxShadow: focused ? "0 0 0 3px rgba(99, 102, 241, 0.1)" : "none",
          }}
        />
      </div>
      {hint && (
        <p style={{ fontSize: "11px", color: "#475569", marginTop: "2px" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

interface TextAreaFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  icon: React.ReactNode;
  rows?: number;
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  icon,
  rows = 3,
}: TextAreaFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label
        htmlFor={id}
        style={{
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: focused ? "#6366f1" : "#94a3b8",
          transition: "color 0.2s ease",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", opacity: 0.8 }}>
          {icon}
        </span>
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          width: "100%",
          padding: "14px 16px",
          background: focused
            ? "rgba(99, 102, 241, 0.06)"
            : "rgba(255, 255, 255, 0.03)",
          border: `1.5px solid ${focused ? "rgba(99, 102, 241, 0.5)" : "rgba(255, 255, 255, 0.08)"
            }`,
          borderRadius: "12px",
          color: "#f1f5f9",
          fontSize: "15px",
          fontFamily: "inherit",
          outline: "none",
          transition: "all 0.2s ease",
          boxShadow: focused ? "0 0 0 3px rgba(99, 102, 241, 0.1)" : "none",
          resize: "vertical",
          lineHeight: "1.6",
        }}
      />
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  accentColor = "rgba(99, 102, 241, 0.15)",
}: {
  icon: React.ReactNode;
  title: string;
  accentColor?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "20px",
        paddingBottom: "16px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          background: accentColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#a5b4fc",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <h2
        style={{
          fontSize: "14px",
          fontWeight: 600,
          color: "#e2e8f0",
          letterSpacing: "0.02em",
        }}
      >
        {title}
      </h2>
    </div>
  );
}

/* ─────────────────────────── Items sub-row ─────────────────────────────── */

interface ItemRowProps {
  index: number;
  item: { description: string; unitPrice: string; quantity: string };
  onChange: (index: number, field: string, val: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

function ItemRow({ index, item, onChange, onRemove, canRemove }: ItemRowProps) {
  const [hoveredRemove, setHoveredRemove] = useState(false);
  const lineTotal =
    (parseFloat(item.unitPrice) || 0) * (parseInt(item.quantity) || 0);

  return (
    <div className="item-row-grid">
      {/* Description */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {index === 0 && (
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#64748b",
            }}
          >
            Description
          </span>
        )}
        <input
          id={`item-desc-${index}`}
          type="text"
          value={item.description}
          onChange={(e) => onChange(index, "description", e.target.value)}
          placeholder="e.g. Collar neck Shirts"
          required
          style={{
            padding: "11px 14px",
            background: "rgba(255,255,255,0.04)",
            border: "1.5px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            color: "#f1f5f9",
            fontSize: "14px",
            fontFamily: "inherit",
            outline: "none",
            width: "100%",
          }}
        />
      </div>

      {/* Unit Price */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {index === 0 && (
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#64748b",
            }}
          >
            Unit Price
          </span>
        )}
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#475569",
              fontWeight: 700,
              fontSize: "14px",
              pointerEvents: "none",
            }}
          >
            ₦
          </span>
          <input
            id={`item-price-${index}`}
            type="number"
            value={item.unitPrice}
            onChange={(e) => onChange(index, "unitPrice", e.target.value)}
            placeholder="0"
            required
            min="0"
            style={{
              padding: "11px 12px 11px 28px",
              background: "rgba(255,255,255,0.04)",
              border: "1.5px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              color: "#f1f5f9",
              fontSize: "14px",
              fontFamily: "inherit",
              outline: "none",
              width: "100%",
            }}
          />
        </div>
      </div>

      {/* Qty */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {index === 0 && (
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#64748b",
            }}
          >
            Qty
          </span>
        )}
        <input
          id={`item-qty-${index}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={item.quantity}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9]/g, "");
            onChange(index, "quantity", val);
          }}
          placeholder="1"
          style={{
            padding: "11px 12px",
            background: "rgba(255,255,255,0.04)",
            border: "1.5px solid rgba(255,255,255,0.08)",
            borderRadius: "10px",
            color: "#f1f5f9",
            fontSize: "14px",
            fontFamily: "inherit",
            outline: "none",
            width: "100%",
          }}
        />
      </div>

      {/* Remove + line total */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "6px",
        }}
      >
        {index === 0 && (
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#64748b",
            }}
          >
            Total
          </span>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#94a3b8",
              whiteSpace: "nowrap",
            }}
          >
            ₦{lineTotal.toLocaleString("en-NG")}
          </span>
          {canRemove && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              onMouseEnter={() => setHoveredRemove(true)}
              onMouseLeave={() => setHoveredRemove(false)}
              title="Remove item"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "30px",
                height: "30px",
                borderRadius: "8px",
                border: "1px solid rgba(244,63,94,0.25)",
                background: hoveredRemove
                  ? "rgba(244,63,94,0.15)"
                  : "rgba(244,63,94,0.06)",
                color: "#f43f5e",
                cursor: "pointer",
                transition: "all 0.2s ease",
                flexShrink: 0,
              }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────── main form ─────────────────────────────── */

export default function InvoiceForm({ onSubmit }: InvoiceFormProps) {
  const today = new Date();
  const due = new Date(today);
  due.setDate(due.getDate() + 30);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    discount: "0",
    companyName: "",
    notes: "",
    issueDate: formatDateInput(today),
    dueDate: formatDateInput(due),
    invoiceNumber: generateInvoiceNumber(),
    bankName: "",
    accountName: "",
    accountNumber: "",
    phone: "",
    whatsapp: "",
    emailContact: "",
    instagram: "",
    country: "",
    brandName: "",
  });

  const [items, setItems] = useState([
    { description: "", unitPrice: "", quantity: "1" },
  ]);

  const [hoveredBtn, setHoveredBtn] = useState(false);
  const [hoveredAdd, setHoveredAdd] = useState(false);

  const set = (key: string) => (val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleItemChange = (index: number, field: string, val: string) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [field]: val } : it))
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { description: "", unitPrice: "", quantity: "1" },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Live subtotal for display
  const subtotal = items.reduce(
    (sum, it) =>
      sum + (parseFloat(it.unitPrice) || 0) * (parseInt(it.quantity, 10) || 0),
    0
  );
  const discountPct = parseFloat(form.discount) || 0;
  const total = subtotal - (subtotal * discountPct) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const invoiceItems: InvoiceItem[] = items.map((it) => ({
      description: it.description,
      unitPrice: parseFloat(it.unitPrice) || 0,
      quantity: Math.max(1, parseInt(it.quantity, 10) || 1),
    }));
    onSubmit({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      items: invoiceItems,
      discount: discountPct,
      companyName: form.companyName,
      notes: form.notes,
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      invoiceNumber: form.invoiceNumber,
      bankName: form.bankName,
      accountName: form.accountName,
      accountNumber: form.accountNumber,
      phone: form.phone,
      whatsapp: form.whatsapp,
      emailContact: form.emailContact,
      instagram: form.instagram,
      country: form.country,
      brandName: form.brandName,
    });
  };

  return (
    <div
      className="form-outer-padding"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        position: "relative",
      }}
    >
      {/* Header */}
      <div
        className="animate-fade-in-up"
        style={{ textAlign: "center", marginBottom: "48px", maxWidth: "600px" }}
      >


        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 52px)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: "16px",
            background: "linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Create Your Invoice
        </h1>
        <p
          style={{
            color: "#64748b",
            fontSize: "10px",
            lineHeight: 1.7,
            maxWidth: "440px",
            margin: "0 auto",
          }}
        >
          Fill in the details below to generate a professional invoice — ready
          to download or send in seconds.
        </p>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="animate-fade-in-up form-card-padding"
        style={{
          width: "100%",
          maxWidth: "720px",
          background: "rgba(13, 18, 32, 0.8)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: "24px",
          boxShadow:
            "0 40px 80px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255,255,255,0.08)",
          animationDelay: "0.1s",
          opacity: 0,
          animationFillMode: "forwards",
        }}
      >
        {/* ── Brand ── */}
        <div style={{ marginBottom: "32px" }}>
          <SectionHeader
            icon={<Tag size={16} strokeWidth={2} />}
            title="Brand / Business"
            accentColor="rgba(245, 158, 11, 0.15)"
          />
          <div style={{ display: "grid", gap: "16px" }}>
            <InputField
              id="brandName"
              label="Brand Name"
              value={form.brandName}
              onChange={set("brandName")}
              placeholder="Two Blackmen"
              icon={<Tag size={12} />}
              hint="Displayed in the invoice header"
            />
            <InputField
              id="country"
              label="Country / Location"
              value={form.country}
              onChange={set("country")}
              placeholder="Nigeria"
              icon={<Building2 size={12} />}
            />
          </div>
        </div>

        {/* ── Client ── */}
        <div style={{ marginBottom: "32px" }}>
          <SectionHeader
            icon={<User size={16} strokeWidth={2} />}
            title="Client Information"
            accentColor="rgba(99, 102, 241, 0.15)"
          />

          <div
            className="grid-2col"
            style={{ marginBottom: "16px" }}
          >
            <InputField
              id="firstName"
              label="First Name"
              value={form.firstName}
              onChange={set("firstName")}
              placeholder="John"
              required
              icon={<User size={12} />}
            />
            <InputField
              id="lastName"
              label="Last Name"
              value={form.lastName}
              onChange={set("lastName")}
              placeholder="Doe"
              required
              icon={<User size={12} />}
            />
          </div>

          <div style={{ display: "grid", gap: "16px" }}>
            <InputField
              id="email"
              label="Email Address"
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="john@example.com"
              required
              icon={<Mail size={12} />}
            />
            <InputField
              id="companyName"
              label="Company / Organization"
              value={form.companyName || ""}
              onChange={set("companyName")}
              placeholder="Acme Corp (optional)"
              icon={<Building2 size={12} />}
            />
          </div>
        </div>

        {/* ── Invoice Details ── */}
        <div style={{ marginBottom: "32px" }}>
          <SectionHeader
            icon={<FileText size={16} strokeWidth={2} />}
            title="Invoice Details"
            accentColor="rgba(6, 182, 212, 0.15)"
          />

          <div style={{ display: "grid", gap: "16px" }}>
            <div className="grid-3col">
              <InputField
                id="invoiceNumber"
                label="Invoice #"
                value={form.invoiceNumber}
                onChange={set("invoiceNumber")}
                placeholder="0033"
                icon={<Hash size={12} />}
              />
              <InputField
                id="issueDate"
                label="Issue Date"
                type="date"
                value={form.issueDate}
                onChange={set("issueDate")}
                icon={<Calendar size={12} />}
              />
              <InputField
                id="dueDate"
                label="Due Date"
                type="date"
                value={form.dueDate}
                onChange={set("dueDate")}
                icon={<Clock size={12} />}
              />
            </div>

            {/* ── Line Items ── */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#94a3b8",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Package size={12} style={{ opacity: 0.8 }} />
                  Line Items
                  <span style={{ color: "#f43f5e", marginLeft: "2px" }}>*</span>
                </label>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#475569",
                    background: "rgba(255,255,255,0.04)",
                    padding: "3px 10px",
                    borderRadius: "100px",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {items.map((item, index) => (
                  <ItemRow
                    key={index}
                    index={index}
                    item={item}
                    onChange={handleItemChange}
                    onRemove={removeItem}
                    canRemove={items.length > 1}
                  />
                ))}
              </div>

              {/* Add Item */}
              <button
                type="button"
                id="add-item-btn"
                onClick={addItem}
                onMouseEnter={() => setHoveredAdd(true)}
                onMouseLeave={() => setHoveredAdd(false)}
                style={{
                  marginTop: "10px",
                  width: "100%",
                  padding: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  background: hoveredAdd
                    ? "rgba(99,102,241,0.1)"
                    : "rgba(99,102,241,0.05)",
                  border: `1.5px dashed ${hoveredAdd ? "rgba(99,102,241,0.5)" : "rgba(99,102,241,0.25)"}`,
                  borderRadius: "12px",
                  color: hoveredAdd ? "#818cf8" : "#6366f1",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  fontFamily: "inherit",
                }}
              >
                <PlusCircle size={16} />
                Add Another Item
              </button>
            </div>

            {/* Discount + live total */}
            <div className="discount-grid">
              <InputField
                id="discount"
                label="Discount %"
                type="number"
                value={form.discount}
                onChange={set("discount")}
                placeholder="0"
                icon={<Percent size={12} />}
              />
              {/* Live preview */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  gap: "4px",
                  paddingBottom: "2px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    color: "#64748b",
                  }}
                >
                  <span>Subtotal</span>
                  <span>₦{subtotal.toLocaleString("en-NG")}</span>
                </div>
                {discountPct > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "12px",
                      color: "#f59e0b",
                    }}
                  >
                    <span>Discount ({discountPct}%)</span>
                    <span>
                      -₦
                      {((subtotal * discountPct) / 100).toLocaleString("en-NG")}
                    </span>
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#f1f5f9",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    paddingTop: "4px",
                    marginTop: "2px",
                  }}
                >
                  <span>Total</span>
                  <span>₦{total.toLocaleString("en-NG")}</span>
                </div>
              </div>
            </div>

            <TextAreaField
              id="notes"
              label="Additional Notes"
              value={form.notes || ""}
              onChange={set("notes")}
              placeholder="Payment terms, special instructions... (optional)"
              icon={<MessageSquare size={12} />}
              rows={2}
            />
          </div>
        </div>

        {/* ── Payment Details ── */}
        <div style={{ marginBottom: "32px" }}>
          <SectionHeader
            icon={<Landmark size={16} strokeWidth={2} />}
            title="Payment / Bank Details"
            accentColor="rgba(16, 185, 129, 0.15)"
          />
          <div style={{ display: "grid", gap: "16px" }}>
            <InputField
              id="bankName"
              label="Bank Name"
              value={form.bankName}
              onChange={set("bankName")}
              placeholder="Moniepoint"
              icon={<Landmark size={12} />}
            />
            <InputField
              id="accountName"
              label="Account Name"
              value={form.accountName}
              onChange={set("accountName")}
              placeholder="Two Blackmen (Gideon Akani)"
              icon={<User size={12} />}
            />
            <InputField
              id="accountNumber"
              label="Account Number"
              value={form.accountNumber}
              onChange={set("accountNumber")}
              placeholder="9036329918"
              icon={<CreditCard size={12} />}
            />
          </div>
        </div>

        {/* ── Contact Info ── */}
        <div style={{ marginBottom: "32px" }}>
          <SectionHeader
            icon={<Phone size={16} strokeWidth={2} />}
            title="Contact & Social (Footer)"
            accentColor="rgba(236, 72, 153, 0.15)"
          />
          <div className="grid-2col">
            <InputField
              id="phone"
              label="Phone"
              value={form.phone}
              onChange={set("phone")}
              placeholder="+234-903-632-9918"
              icon={<Phone size={12} />}
            />
            <InputField
              id="whatsapp"
              label="WhatsApp"
              value={form.whatsapp}
              onChange={set("whatsapp")}
              placeholder="+234-813-253-2887"
              icon={<Phone size={12} />}
            />
            <InputField
              id="emailContact"
              label="Email (footer)"
              type="email"
              value={form.emailContact}
              onChange={set("emailContact")}
              placeholder="hello@brand.com"
              icon={<Mail size={12} />}
            />
            <InputField
              id="instagram"
              label="Instagram"
              value={form.instagram}
              onChange={set("instagram")}
              placeholder="2black_men_"
              icon={<AtSign size={12} />}
            />
          </div>
        </div>

        {/* ── Submit ── */}
        <button
          id="generate-invoice-btn"
          type="submit"
          onMouseEnter={() => setHoveredBtn(true)}
          onMouseLeave={() => setHoveredBtn(false)}
          style={{
            width: "100%",
            padding: "16px 24px",
            background: hoveredBtn
              ? "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #0891b2 100%)"
              : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)",
            border: "none",
            borderRadius: "14px",
            color: "white",
            fontSize: "16px",
            fontWeight: 700,
            letterSpacing: "0.02em",
            cursor: "pointer",
            transition: "all 0.3s ease",
            transform: hoveredBtn ? "translateY(-2px)" : "translateY(0)",
            boxShadow: hoveredBtn
              ? "0 20px 40px rgba(99, 102, 241, 0.4)"
              : "0 8px 24px rgba(99, 102, 241, 0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            fontFamily: "inherit",
          }}
        >
          Preview Invoice
          <ArrowRight
            size={18}
            style={{
              transform: hoveredBtn ? "translateX(4px)" : "translateX(0)",
              transition: "transform 0.3s ease",
            }}
          />
        </button>

        <p
          style={{
            textAlign: "center",
            color: "#475569",
            fontSize: "12px",
            marginTop: "16px",
            lineHeight: 1.6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
          }}
        >
          <Lock size={12} />
          Your data is processed securely and never stored on our servers.
        </p>
      </form>
    </div>
  );
}
