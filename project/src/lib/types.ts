export type ProductCategory = string;
export type PaymentMethod = 'dinheiro' | 'cartão' | 'pix';
export type SaleStatus = 'pago' | 'pendente';
export type PlanType = 'mensal' | 'trimestral' | 'semestral' | 'anual';

export interface Category {
  id: string;
  value: string;
  label: string;
  group: string;
  active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  barcode: string;
  price: number;
  category: ProductCategory;
  stock: number;
  active: boolean;
  created_at: string;
}

export interface Member {
  id: string;
  name: string;
  cpf: string;
  registration_number: string;
  phone: string | null;
  cep: string;
  street: string;
  house_number: string;
  complement: string;
  city: string;
  active: boolean;
  created_at: string;
}

export interface Plan {
  id: string;
  member_id: string;
  plan_type: PlanType;
  price: number;
  payment_date?: string;
  start_date: string;
  end_date: string;
  active: boolean;
  created_at: string;
  member?: Member;
}

export interface Sale {
  id: string;
  member_id: string | null;
  total: number;
  payment_method: PaymentMethod;
  status: SaleStatus;
  created_at: string;
  member?: Member;
  sale_items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Supplier {
  id: string;
  name: string;
  cnpj: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
  created_at: string;
}

export const CATEGORIES: { value: ProductCategory; label: string; group: string }[] = [
  { value: 'kimono', label: 'Kimono/Gi', group: 'Equipamentos' },
  { value: 'rashguard', label: 'Rashguard', group: 'Equipamentos' },
  { value: 'shorts', label: 'Shorts/Bermuda', group: 'Equipamentos' },
  { value: 'faixa', label: 'Faixa', group: 'Equipamentos' },
  { value: 'protetor', label: 'Protetor', group: 'Equipamentos' },
  { value: 'suplemento', label: 'Suplemento', group: 'Nutrição' },
  { value: 'acessorio', label: 'Acessório', group: 'Outros' },
  { value: 'cerveja', label: 'Cerveja', group: 'Bebidas' },
  { value: 'refrigerante', label: 'Refrigerante', group: 'Bebidas' },
  { value: 'agua', label: 'Água', group: 'Bebidas' },
  { value: 'destilado', label: 'Destilado', group: 'Bebidas' },
  { value: 'vinho', label: 'Vinho', group: 'Bebidas' },
  { value: 'petisco', label: 'Petisco', group: 'Alimentação' },
  { value: 'outro', label: 'Outro', group: 'Outros' },
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; color: string }[] = [
  { value: 'dinheiro', label: 'Dinheiro', color: '#22c55e' },
  { value: 'cartão', label: 'Cartão', color: '#f97316' },
  { value: 'pix', label: 'Pix', color: '#3b82f6' },
];

export const PLAN_TYPES: { value: PlanType; label: string }[] = [
  { value: 'mensal', label: 'Mensal' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
];

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export function formatCPF(cpf: string): string {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function formatCEP(cep: string): string {
  const d = cep.replace(/\D/g, '');
  if (d.length !== 8) return cep;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function todayStart(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function todayEnd(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}
