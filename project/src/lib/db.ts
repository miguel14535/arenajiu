import type {
  Product, Member, Plan, Sale, SaleItem, Supplier,
  PaymentMethod, ProductCategory, Category, SaleStatus,
} from './types';
import { syncLocalKeyToRemote } from './remoteSync';

const K = {
  products: 'arena_products',
  members: 'arena_members',
  plans: 'arena_plans',
  sales: 'arena_sales',
  saleItems: 'arena_sale_items',
  suppliers: 'arena_suppliers',
  categories: 'arena_categories',
  seeded: 'arena_seeded',
};

function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]'); }
  catch { return []; }
}

function save<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
  syncLocalKeyToRemote(key);
}

function uid(): string { return crypto.randomUUID(); }
function now(): string { return new Date().toISOString(); }

function normalizeMember(m: Partial<Member>): Member {
  return {
    id: m.id ?? uid(),
    name: m.name ?? '',
    cpf: m.cpf ?? '',
    registration_number: m.registration_number ?? '',
    phone: m.phone ?? null,
    cep: m.cep ?? '',
    street: m.street ?? '',
    house_number: m.house_number ?? '',
    complement: m.complement ?? '',
    city: m.city ?? '',
    active: m.active ?? true,
    created_at: m.created_at ?? now(),
  };
}

export function generateRegistrationNumber(): string {
  const members = getMembers();

  let nextNumber = 1;

  while (
    members.some(
      m => m.registration_number === String(nextNumber).padStart(3, '0')
    )
  ) {
    nextNumber++;
  }

  return String(nextNumber).padStart(3, '0');
}

// ─── Categories ──────────────────────────────────────────────────────────────

export function getCategories(): Category[] {
  return load<Category>(K.categories);
}

export function getActiveCategories(): Category[] {
  return getCategories()
    .filter(c => c.active)
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function insertCategory(data: Omit<Category, 'id' | 'created_at' | 'active'>): { error: string | null } {
  const categories = getCategories();

  if (categories.some(c => c.value === data.value && c.active)) {
    return { error: 'Categoria já cadastrada.' };
  }

  save(K.categories, [
    ...categories,
    {
      id: uid(),
      created_at: now(),
      active: true,
      ...data,
    },
  ]);

  return { error: null };
}

export function updateCategory(id: string, updates: Partial<Omit<Category, 'id' | 'created_at'>>): void {
  save(
    K.categories,
    getCategories().map(c => c.id === id ? { ...c, ...updates } : c)
  );
}

export function softDeleteCategory(id: string): void {
  save(
    K.categories,
    getCategories().map(c => c.id === id ? { ...c, active: false } : c)
  );
}

// ─── Products ────────────────────────────────────────────────────────────────

export function getProducts(): Product[] {
  return load<Product>(K.products);
}

export function getActiveProducts(): Product[] {
  return getProducts()
    .filter(p => p.active)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getProductByBarcode(barcode: string): Product | undefined {
  return getProducts().find(p => p.barcode === barcode && p.active);
}

export function insertProduct(data: Omit<Product, 'id' | 'created_at' | 'active'>): { error: string | null } {
  const products = getProducts();

  if (products.some(p => p.barcode === data.barcode && p.active)) {
    return { error: 'Código de barras já cadastrado.' };
  }

  save(K.products, [
    ...products,
    { id: uid(), created_at: now(), active: true, ...data },
  ]);

  return { error: null };
}

export function updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'created_at'>>): void {
  const products = getProducts();

  const conflictBarcode =
    updates.barcode &&
    products.some(p => p.barcode === updates.barcode && p.id !== id && p.active);

  if (conflictBarcode) return;

  save(K.products, products.map(p => p.id === id ? { ...p, ...updates } : p));
}

export function softDeleteProduct(id: string): void {
  save(
    K.products,
    getProducts().map(p => p.id === id ? { ...p, active: false } : p)
  );
}

// ─── Members ─────────────────────────────────────────────────────────────────

export function getMembers(): Member[] {
  return load<Partial<Member>>(K.members).map(normalizeMember);
}

export function getActiveMembers(): Member[] {
  return getMembers()
    .filter(m => m.active)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function searchMembers(query: string): Member[] {
  const q = query.toLowerCase();

  return getActiveMembers()
    .filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.cpf.includes(q) ||
      m.registration_number.toLowerCase().includes(q) ||
      m.street.toLowerCase().includes(q) ||
      m.city.toLowerCase().includes(q)
    )
    .slice(0, 10);
}

export function insertMember(
  data: Omit<Member, 'id' | 'created_at' | 'active'>
): { error: string | null } {
  const members = getMembers();

  if (members.some(m => m.cpf === data.cpf && m.active)) {
    return { error: 'CPF já cadastrado.' };
  }

  const registrationNumber =
    data.registration_number?.trim() || generateRegistrationNumber();

  if (
    members.some(
      m => m.registration_number === registrationNumber && m.active
    )
  ) {
    return { error: 'Matrícula já cadastrada.' };
  }

  save(K.members, [
    ...members,
    {
      id: uid(),
      created_at: now(),
      active: true,
      ...data,
      registration_number: registrationNumber,
    },
  ]);

  return { error: null };
}

export function updateMember(
  id: string,
  updates: Partial<Omit<Member, 'id' | 'created_at'>>
): { error: string | null } {
  const members = getMembers();

  if (updates.cpf && members.some(m => m.cpf === updates.cpf && m.id !== id && m.active)) {
    return { error: 'CPF já cadastrado.' };
  }

  if (
    updates.registration_number &&
    members.some(m => m.registration_number === updates.registration_number && m.id !== id && m.active)
  ) {
    return { error: 'Matrícula já cadastrada.' };
  }

  save(K.members, members.map(m => m.id === id ? { ...m, ...updates } : m));

  return { error: null };
}

export function softDeleteMember(id: string): void {
  save(
    K.members,
    getMembers().map(m => m.id === id ? { ...m, active: false } : m)
  );
}

export function getMemberById(id: string): Member | undefined {
  return getMembers().find(m => m.id === id);
}

// ─── Plans ───────────────────────────────────────────────────────────────────

export function getPlans(): Plan[] {
  return load<Plan>(K.plans);
}

export function getPlansByMemberId(memberId: string): Plan[] {
  return getPlans().filter(p => p.member_id === memberId);
}

export function insertPlan(data: Omit<Plan, 'id' | 'created_at' | 'active'>): void {
  const plans = getPlans();

  save(K.plans, [
    ...plans,
    { id: uid(), created_at: now(), active: true, ...data },
  ]);
}

export function updatePlan(id: string, updates: Partial<Omit<Plan, 'id' | 'created_at'>>): void {
  save(
    K.plans,
    getPlans().map(p => p.id === id ? { ...p, ...updates } : p)
  );
}

// ─── Sales ───────────────────────────────────────────────────────────────────

export function getSales(): Sale[] {
  return load<Sale>(K.sales).map(s => ({
    ...s,
    status: s.status ?? 'pago',
  }));
}

export function insertSale(data: {
  member_id: string | null;
  total: number;
  payment_method: PaymentMethod;
  status: SaleStatus;
}): Sale {
  const sales = getSales();

  const sale: Sale = {
    id: uid(),
    created_at: now(),
    ...data,
  };

  save(K.sales, [...sales, sale]);

  return sale;
}

export function markSaleAsPaid(saleId: string): void {
  save(
    K.sales,
    getSales().map(s =>
      s.id === saleId
        ? { ...s, status: 'pago' }
        : s
    )
  );
}

export function deleteSale(saleId: string): void {
  const sales = getSales();
  const saleItems = getSaleItems();
  const products = getProducts();

  const itemsToDelete = saleItems.filter(item => item.sale_id === saleId);

  const updatedProducts = products.map(product => {
    const item = itemsToDelete.find(i => i.product_id === product.id);

    if (!item) return product;

    return {
      ...product,
      stock: product.stock + item.quantity,
    };
  });

  save(K.products, updatedProducts);
  save(K.sales, sales.filter(sale => sale.id !== saleId));
  save(K.saleItems, saleItems.filter(item => item.sale_id !== saleId));
}

// ─── Sale Items ──────────────────────────────────────────────────────────────

export function getSaleItems(): SaleItem[] {
  return load<SaleItem>(K.saleItems);
}

export function insertSaleItems(items: Omit<SaleItem, 'id'>[]): void {
  const existing = getSaleItems();

  save(K.saleItems, [
    ...existing,
    ...items.map(i => ({ id: uid(), ...i })),
  ]);
}

// ─── Suppliers ───────────────────────────────────────────────────────────────

export function getSuppliers(): Supplier[] {
  return load<Supplier>(K.suppliers);
}

export function getActiveSuppliers(): Supplier[] {
  return getSuppliers()
    .filter(s => s.active)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function insertSupplier(data: Omit<Supplier, 'id' | 'created_at' | 'active'>): void {
  save(K.suppliers, [
    ...getSuppliers(),
    { id: uid(), created_at: now(), active: true, ...data },
  ]);
}

export function updateSupplier(id: string, updates: Partial<Omit<Supplier, 'id' | 'created_at'>>): void {
  save(
    K.suppliers,
    getSuppliers().map(s => s.id === id ? { ...s, ...updates } : s)
  );
}

export function softDeleteSupplier(id: string): void {
  save(
    K.suppliers,
    getSuppliers().map(s => s.id === id ? { ...s, active: false } : s)
  );
}

// ─── Joined queries ──────────────────────────────────────────────────────────

export interface MemberWithPlans extends Member {
  plans: Plan[];
}

export function getMembersWithPlans(): MemberWithPlans[] {
  const members = getActiveMembers();
  const plans = getPlans();

  return members.map(m => ({
    ...m,
    plans: plans.filter(p => p.member_id === m.id),
  }));
}

export interface SaleWithDetails extends Sale {
  member?: Member;
  sale_items: SaleItem[];
}

export function getSalesWithDetails(opts: {
  startDate?: string;
  endDate?: string;
  memberId?: string;
  status?: SaleStatus;
}): SaleWithDetails[] {
  const sales = getSales();
  const saleItems = getSaleItems();
  const members = getMembers();

  return sales
    .filter(s => {
      if (opts.memberId && s.member_id !== opts.memberId) return false;
      if (opts.status && s.status !== opts.status) return false;
      if (opts.startDate && s.created_at < opts.startDate + 'T00:00:00') return false;
      if (opts.endDate && s.created_at > opts.endDate + 'T23:59:59') return false;
      return true;
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(s => ({
      ...s,
      member: s.member_id ? members.find(m => m.id === s.member_id) : undefined,
      sale_items: saleItems.filter(i => i.sale_id === s.id),
    }));
}

export function getTodaySalesWithDetails(): SaleWithDetails[] {
  const today = new Date().toISOString().split('T')[0];

  return getSalesWithDetails({ startDate: today, endDate: today });
}

export function getPendingSalesByMember(memberId: string): SaleWithDetails[] {
  return getSalesWithDetails({
    memberId,
    status: 'pendente',
  });
}

export function getMemberDebt(memberId: string): number {
  return getPendingSalesByMember(memberId)
    .reduce((sum, sale) => sum + sale.total, 0);
}

export function getAllPendingSales(): SaleWithDetails[] {
  return getSalesWithDetails({ status: 'pendente' });
}

export function getTotalPendingDebt(): number {
  return getAllPendingSales()
    .reduce((sum, sale) => sum + sale.total, 0);
}

// ─── Seed ────────────────────────────────────────────────────────────────────

const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'created_at' | 'active'>[] = [
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

const SEED_PRODUCTS: Omit<Product, 'id' | 'created_at' | 'active'>[] = [
  { name: 'Kimono Arena Classic Branco A2', barcode: '7891234500001', price: 259.90, category: 'kimono' as ProductCategory, stock: 20 },
  { name: 'Kimono Arena Classic Azul A2', barcode: '7891234500002', price: 259.90, category: 'kimono' as ProductCategory, stock: 15 },
  { name: 'Kimono Arena Classic Preto A2', barcode: '7891234500003', price: 259.90, category: 'kimono' as ProductCategory, stock: 12 },
  { name: 'Rashguard Arena Manga Longa P', barcode: '7891234500010', price: 89.90, category: 'rashguard' as ProductCategory, stock: 30 },
  { name: 'Rashguard Arena Manga Curta M', barcode: '7891234500011', price: 69.90, category: 'rashguard' as ProductCategory, stock: 25 },
  { name: 'Shorts Arena Fight G', barcode: '7891234500020', price: 79.90, category: 'shorts' as ProductCategory, stock: 20 },
  { name: 'Faixa Branca A3', barcode: '7891234500030', price: 29.90, category: 'faixa' as ProductCategory, stock: 50 },
  { name: 'Faixa Azul A3', barcode: '7891234500031', price: 34.90, category: 'faixa' as ProductCategory, stock: 30 },
  { name: 'Faixa Roxa A3', barcode: '7891234500032', price: 34.90, category: 'faixa' as ProductCategory, stock: 20 },
  { name: 'Protetor Bucal Simples', barcode: '7891234500040', price: 19.90, category: 'protetor' as ProductCategory, stock: 40 },
  { name: 'Coque para Orelha', barcode: '7891234500041', price: 89.90, category: 'protetor' as ProductCategory, stock: 15 },
  { name: 'Whey Protein 900g Baunilha', barcode: '7891234500050', price: 129.90, category: 'suplemento' as ProductCategory, stock: 10 },
  { name: 'BCAA 300g', barcode: '7891234500051', price: 79.90, category: 'suplemento' as ProductCategory, stock: 12 },
  { name: 'Mochila Arena Jiu Jitsu', barcode: '7891234500060', price: 149.90, category: 'acessorio' as ProductCategory, stock: 8 },
  { name: 'Garrafa Térmica 500ml Arena', barcode: '7891234500061', price: 49.90, category: 'acessorio' as ProductCategory, stock: 20 },
  { name: 'Água Mineral 500ml', barcode: '7894900010014', price: 3.00, category: 'agua' as ProductCategory, stock: 200 },
  { name: 'Coca-Cola Lata 350ml', barcode: '7894900011517', price: 4.50, category: 'refrigerante' as ProductCategory, stock: 150 },
];

export function seedIfEmpty(): void {
  if (getCategories().length === 0) {
    save(
      K.categories,
      DEFAULT_CATEGORIES.map(c => ({
        id: uid(),
        created_at: now(),
        active: true,
        ...c,
      }))
    );
  }

  if (localStorage.getItem(K.seeded)) return;

  const products = getProducts();

  if (products.length === 0) {
    const seeded = SEED_PRODUCTS.map(p => ({
      id: uid(),
      created_at: now(),
      active: true,
      ...p,
    }));

    save(K.products, seeded);
  }

  localStorage.setItem(K.seeded, '1');
}
