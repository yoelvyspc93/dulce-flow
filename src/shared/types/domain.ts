export type OrderStatus = "pending" | "delivered" | "cancelled";
export type MovementType = "income" | "expense" | "adjustment" | "reversal";
export type MovementDirection = "in" | "out";
export type MovementStatus = "active" | "voided" | "reversed";
export type ExpenseStatus = "active" | "voided";

export type Product = {
  id: string;
  name: string;
  price: number;
  description?: string;
  imageUri?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Supply = {
  id: string;
  name: string;
  unit: string;
  defaultPrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  total: number;
  status: OrderStatus;
  dueDate: string;
  note?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  createdAt: string;
};

export type Expense = {
  id: string;
  supplyId: string;
  supplyName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  status: ExpenseStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type MovementSourceType = "order" | "expense" | "manual";

export type Movement = {
  id: string;
  type: MovementType;
  direction: MovementDirection;
  sourceType: MovementSourceType;
  sourceId?: string;
  amount: number;
  description: string;
  status: MovementStatus;
  movementDate: string;
  createdAt: string;
  updatedAt: string;
  reversedMovementId?: string;
};

export type Setting = {
  key: string;
  value: string;
  updatedAt: string;
};

export type BusinessSettings = {
  businessName: string;
  currency: string;
  avatarId?: string;
  phone?: string;
  address?: string;
};

export type AccessibilitySettings = {
  fontScale: number;
};
