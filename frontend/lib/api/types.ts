// ─────────────────────────────────────────────────────
//  types.ts
//  Shared TypeScript types matching backend models.
//  Keeping these in one place means every component
//  gets autocomplete and type-checking for free.
// ─────────────────────────────────────────────────────

export type UserRole = "user" | "operator" | "admin";

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  avatar?: string | null;
  createdAt?: string;
}

// ── Generic API response shapes ───────────────────────
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data?: T;
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}

// ── Auth ───────────────────────────────────────────────
export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: "user" | "operator";
}

export interface AuthResponseData {
  token: string;
  user: User;
}

// ── Vehicle ─────────────────────────────────────────────
export type VehicleType = "motorcycle" | "car" | "suv" | "van" | "truck" | "bus";

export interface Vehicle {
  _id: string;
  owner: string | User;
  licensePlate: string;
  rfidTag?: string | null;
  make: string;
  model: string;
  year: number;
  color: string;
  vehicleType: VehicleType;
  isActive: boolean;
  isBlacklisted: boolean;
  blacklistReason?: string | null;
  registrationNumber: string;
  registrationExpiry: string;
  insuranceNumber?: string | null;
  insuranceExpiry?: string | null;
  totalTrips: number;
  totalTollPaid: number;
  lastTollDate?: string | null;
  createdAt: string;
}

// ── Account ─────────────────────────────────────────────
export interface Account {
  _id: string;
  owner: string | User;
  balance: number;
  minimumBalance: number;
  isActive: boolean;
  isFrozen: boolean;
  frozenReason?: string | null;
  autoRecharge: {
    isEnabled: boolean;
    rechargeAmount: number;
    triggerAmount: number;
  };
  totalTopUps: number;
  totalTopUpAmount: number;
  totalTollDeductions: number;
  totalTollAmount: number;
  lastTopUpDate?: string | null;
  lastDeductionDate?: string | null;
  accountNumber: string;
  isLowBalance: boolean;
}

// ── Booth ───────────────────────────────────────────────
export interface Booth {
  _id: string;
  name: string;
  boothCode: string;
  description?: string | null;
  location: {
    address: string;
    city: string;
    state: string;
    coordinates?: {
      latitude: number | null;
      longitude: number | null;
    };
  };
  highwayName: string;
  highwayNumber?: string | null;
  totalLanes: number;
  activeLanes: number;
  tollRates: Record<VehicleType, number>;
  status: "operational" | "maintenance" | "closed";
  isActive: boolean;
  assignedOperator?: User | null;
  totalTransactions: number;
  totalRevenue: number;
  todayTransactions: number;
  todayRevenue: number;
}

// ── Transaction ─────────────────────────────────────────
export type TransactionType = "toll" | "topup" | "refund" | "adjustment";
export type TransactionStatus = "success" | "failed" | "pending";

export interface Transaction {
  _id: string;
  transactionRef: string;
  type: TransactionType;
  status: TransactionStatus;
  user: string | User;
  vehicle?: string | Vehicle | null;
  booth?: string | Booth | null;
  operator?: string | User | null;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  tollDetails?: {
    vehicleType?: string;
    licensePlate?: string;
    rfidTag?: string;
    boothCode?: string;
    boothName?: string;
    tollRate?: number;
  };
  failureReason?: string | null;
  description?: string | null;
  createdAt: string;
}

// ── Blacklist ───────────────────────────────────────────
export type BlacklistReason =
  | "unpaid_tolls"
  | "fraud"
  | "stolen"
  | "document_expired"
  | "other";

export interface BlacklistRecord {
  _id: string;
  vehicle: string | Vehicle;
  owner: string | User;
  reason: BlacklistReason;
  description: string;
  unpaidAmount: number;
  status: "active" | "resolved" | "pending_review";
  blacklistedBy: string | User;
  resolvedBy?: string | User | null;
  resolvedAt?: string | null;
  resolutionNotes?: string | null;
  vehicleSnapshot: {
    licensePlate?: string;
    make?: string;
    model?: string;
    vehicleType?: string;
  };
  ownerSnapshot: {
    name?: string;
    email?: string;
    phone?: string;
  };
  createdAt: string;
}

// ── Chat ────────────────────────────────────────────────
export interface Conversation {
  conversationId: string;
  otherUser: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface ChatMessage {
  _id: string;
  conversation: string;
  sender: { _id: string; name: string; role: UserRole } | string;
  receiver: string;
  content: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}