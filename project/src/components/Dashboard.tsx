import { useState, useEffect, useCallback } from 'react';
import {
  getActiveProducts,
  getSalesWithDetails,
  deleteSale,
  SaleWithDetails,
} from '../lib/db';
import { formatCurrency, formatDate, PAYMENT_METHODS } from '../lib/types';
import DonutChart from './DonutChart';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  ArrowRight,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Trash2,
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

interface DailyStats {
  revenue: number;
  salesCount: number;
  itemsSold: number;
  clientsServed: number;
  productsTotal: number;
}

interface PaymentBreakdown {
  method: string;
  total: number;
  label: string;
  color: string;
}

interface TopProduct {
  name: string;
  qty: number;
  revenue: number;
}

function toDateInputValue(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatSelectedDate(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(
    new Date(dateStr + 'T12:00:00')
  );
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [selectedDate, setSelectedDate] = useState(toDateInputValue(new Date()));
  const [stats, setStats] = useState<DailyStats>({
    revenue: 0,
    salesCount: 0,
    itemsSold: 0,
    clientsServed: 0,
    productsTotal: 0,
  });
  const [recentSales, setRecentSales] = useState<SaleWithDetails[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentClients, setRecentClients] = useState<
    { id: string; name: string; phone: string | null; total: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);

    const selectedSales = getSalesWithDetails({
      startDate: selectedDate,
      endDate: selectedDate,
    });

    const products = getActiveProducts();

    const revenue = selectedSales.reduce((s, x) => s + x.total, 0);
    const itemsSold = selectedSales.reduce(
      (s, x) => s + x.sale_items.reduce((sq, i) => sq + i.quantity, 0),
      0
    );
    const clientsServed = new Set(
      selectedSales.filter(s => s.member_id).map(s => s.member_id)
    ).size;

    setStats({
      revenue,
      salesCount: selectedSales.length,
      itemsSold,
      clientsServed,
      productsTotal: products.length,
    });

    setRecentSales(selectedSales.slice(0, 6));

    const pbMap: Record<string, number> = {};
    for (const s of selectedSales) {
      pbMap[s.payment_method] = (pbMap[s.payment_method] ?? 0) + s.total;
    }

    setPaymentBreakdown(
      PAYMENT_METHODS.map(pm => ({
        method: pm.value,
        label: pm.label,
        color: pm.color,
        total: pbMap[pm.value] ?? 0,
      })).filter(p => p.total > 0)
    );

    const prodMap: Record<string, { qty: number; revenue: number }> = {};

    for (const s of selectedSales) {
      for (const item of s.sale_items) {
        if (!prodMap[item.product_name]) {
          prodMap[item.product_name] = { qty: 0, revenue: 0 };
        }

        prodMap[item.product_name].qty += item.quantity;
        prodMap[item.product_name].revenue += item.total_price;
      }
    }

    setTopProducts(
      Object.entries(prodMap)
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 6)
    );

    const clientMap: Record<string, { name: string; phone: string | null; total: number }> = {};

    for (const s of selectedSales) {
      if (s.member && s.member_id) {
        if (!clientMap[s.member_id]) {
          clientMap[s.member_id] = {
            name: s.member.name,
            phone: s.member.phone ?? null,
            total: 0,
          };
        }

        clientMap[s.member_id].total += s.total;
      }
    }

    setRecentClients(
      Object.entries(clientMap)
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
    );

    setLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    load();
  }, [load]);

  function handleDeleteSale(sale: SaleWithDetails) {
    const confirmDelete = confirm(
      `Deseja excluir esta venda de ${formatCurrency(sale.total)}?\n\nEssa ação também devolve os itens para o estoque.`
    );

    if (!confirmDelete) return;

    deleteSale(sale.id);
    load();
  }

  const paymentTotal = paymentBreakdown.reduce((s, p) => s + p.total, 0);

  const today = toDateInputValue(new Date());
  const isToday = selectedDate === today;

  const statCards = [
    {
      label: isToday ? 'FATURAMENTO HOJE' : 'FATURAMENTO DO DIA',
      value: formatCurrency(stats.revenue),
      sub: `${stats.salesCount} vendas`,
      icon: DollarSign,
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-400',
    },
    {
      label: 'ITENS VENDIDOS',
      value: String(stats.itemsSold),
      sub: 'Itens',
      icon: ShoppingCart,
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
    },
    {
      label: 'CLIENTES ATENDIDOS',
      value: String(stats.clientsServed),
      sub: 'Clientes',
      icon: Users,
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-400',
    },
    {
      label: 'PRODUTOS CADASTRADOS',
      value: String(stats.productsTotal),
      sub: 'Produtos',
      icon: Package,
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
    },
  ];

  return (
    <div className="h-full overflow-auto pr-1">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">DASHBOARD</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Visão geral do seu negócio por data
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-dark-600 border border-dark-300 rounded-lg px-3 py-2">
            <button
              onClick={() => setSelectedDate(prev => addDays(prev, -1))}
              className="p-1 rounded-md hover:bg-dark-400 text-gray-400 hover:text-white transition-colors"
              title="Dia anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <CalendarDays className="w-4 h-4 text-accent" />

            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent text-gray-300 text-sm outline-none"
            />

            <button
              onClick={() => setSelectedDate(prev => addDays(prev, 1))}
              className="p-1 rounded-md hover:bg-dark-400 text-gray-400 hover:text-white transition-colors"
              title="Próximo dia"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(today)}
              className="bg-dark-600 border border-dark-300 hover:bg-dark-500 rounded-lg px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              Hoje
            </button>
          )}

          <button onClick={() => onNavigate('pos')} className="btn-accent shadow-glow-red">
            <ShoppingCart className="w-4 h-4" />
            NOVA VENDA
          </button>
        </div>
      </div>

      <div className="mb-4 text-sm text-gray-400">
        Exibindo dados de:{' '}
        <span className="text-white font-semibold">
          {formatSelectedDate(selectedDate)}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {statCards.map(card => {
          const Icon = card.icon;

          return (
            <div key={card.label} className="stat-card">
              <div
                className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {card.label}
                </p>
                <p className="text-2xl font-bold text-white mt-0.5">
                  {loading ? '—' : card.value}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="col-span-2 dark-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Vendas da Data Selecionada</h2>

            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-accent hover:text-accent-light flex items-center gap-1 transition-colors"
            >
              VER TODAS <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <table className="w-full table-dark">
            <thead>
              <tr>
                <th>#</th>
                <th>DATA</th>
                <th>CLIENTE</th>
                <th>ITENS</th>
                <th>TOTAL</th>
                <th className="text-right">AÇÕES</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-8">
                    Carregando...
                  </td>
                </tr>
              ) : recentSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-8">
                    Nenhuma venda nesta data
                  </td>
                </tr>
              ) : (
                recentSales.map((s, i) => (
                  <tr key={s.id}>
                    <td className="text-gray-400">{i + 1}</td>
                    <td className="text-gray-400 text-xs">{formatDate(s.created_at)}</td>
                    <td className="text-white">{s.member?.name ?? 'Consumidor Final'}</td>
                    <td className="text-gray-300">
                      {s.sale_items.reduce((sum, it) => sum + it.quantity, 0)}
                    </td>
                    <td className="font-semibold text-accent-light">
                      {formatCurrency(s.total)}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleDeleteSale(s)}
                        className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                        title="Excluir venda"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="dark-card p-5">
          <h2 className="section-title">
            Pagamentos{' '}
            <span className="text-gray-500 font-normal text-xs">
              ({formatSelectedDate(selectedDate)})
            </span>
          </h2>

          {loading ? (
            <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
              Carregando...
            </div>
          ) : paymentBreakdown.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
              Sem dados nesta data
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <DonutChart
                segments={paymentBreakdown.map(p => ({
                  value: p.total,
                  color: p.color,
                  label: p.label,
                }))}
                total={paymentTotal}
                centerLabel={formatCurrency(paymentTotal)}
                size={180}
                thickness={36}
              />

              <div className="w-full space-y-2">
                {paymentBreakdown.map(p => (
                  <div key={p.method} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="text-gray-300">{p.label}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-white font-medium">
                        {formatCurrency(p.total)}
                      </span>
                      <span className="text-gray-500 text-xs ml-1">
                        ({paymentTotal > 0 ? ((p.total / paymentTotal) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="dark-card p-5">
          <h2 className="section-title">
            Produtos Mais Vendidos{' '}
            <span className="text-gray-500 font-normal text-xs">
              ({formatSelectedDate(selectedDate)})
            </span>
          </h2>

          <table className="w-full table-dark">
            <thead>
              <tr>
                <th>PRODUTO</th>
                <th className="text-right">QTD</th>
                <th className="text-right">FATURAMENTO</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="text-center text-gray-500 py-6">
                    Carregando...
                  </td>
                </tr>
              ) : topProducts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-gray-500 py-6">
                    Sem dados nesta data
                  </td>
                </tr>
              ) : (
                topProducts.map(p => (
                  <tr key={p.name}>
                    <td className="text-white">{p.name}</td>
                    <td className="text-right text-gray-300 font-medium">{p.qty}</td>
                    <td className="text-right font-semibold text-accent-light">
                      {formatCurrency(p.revenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="dark-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Clientes da Data</h2>

            <button
              onClick={() => onNavigate('members')}
              className="text-xs text-accent hover:text-accent-light flex items-center gap-1 transition-colors"
            >
              VER TODOS <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <table className="w-full table-dark">
            <thead>
              <tr>
                <th>CLIENTE</th>
                <th>TELEFONE</th>
                <th className="text-right">TOTAL</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="text-center text-gray-500 py-6">
                    Carregando...
                  </td>
                </tr>
              ) : recentClients.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-gray-500 py-6">
                    Sem clientes nesta data
                  </td>
                </tr>
              ) : (
                recentClients.map(c => (
                  <tr key={c.id}>
                    <td className="text-white font-medium">{c.name}</td>
                    <td className="text-gray-400 text-xs">{c.phone ?? '—'}</td>
                    <td className="text-right font-semibold text-accent-light">
                      {formatCurrency(c.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 p-4 dark-card">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-white">
            Resumo da Data
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500 uppercase">Vendas</p>
            <p className="text-xl font-bold text-white mt-0.5">{stats.salesCount}</p>
          </div>

          <div className="border-x border-dark-300">
            <p className="text-xs text-gray-500 uppercase">Itens</p>
            <p className="text-xl font-bold text-white mt-0.5">{stats.itemsSold}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase">Faturamento</p>
            <p className="text-xl font-bold text-accent mt-0.5">
              {formatCurrency(stats.revenue)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-600 pb-2">
        <span>Arena Jiu Jitsu - Sistema de Controle de Vendas</span>

        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Dados salvos localmente</span>
        </div>

        <span>Versão 2.0.0</span>
      </div>
    </div>
  );
}