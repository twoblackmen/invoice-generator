export interface InvoiceItem {
  description: string;
  unitPrice: number;
  quantity: number;
}

export interface InvoiceData {
  firstName: string;
  lastName: string;
  email: string;
  items: InvoiceItem[];
  discount: number; // percentage, e.g. 15 means 15%
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  companyName?: string;
  notes?: string;
  // Payment / bank details
  bankName: string;
  accountName: string;
  accountNumber: string;
  // Contact / footer info
  phone?: string;
  whatsapp?: string;
  emailContact?: string;
  instagram?: string;
  country?: string;
  brandName?: string;
}
