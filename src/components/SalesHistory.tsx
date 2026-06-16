import { useState, useEffect, useCallback } from 'react';
import { getSalesWithDetails, getActiveMembers, SaleWithDetails } from '../lib/db';
import { Member, formatCurrency, formatDate, formatCPF } from '../lib/types';
import { History, Search, Calendar, User, ChevronDown, ChevronUp, Receipt, X } from 'lucide-react';

export default function SalesHistory() {
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [memberFilter, setMemberFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expandedSale, setExpandedSale] = useState<string | null>(null);

  const reload = useCallback(() => {
    setMembers(getActiveMembers());
    setSales(getSalesWithDetails({ startDate: startDate || undefined, endDate: endDate || undefined, memberId: memberFilter || undefined }));
  }, [startDate, endDate, memberFilter]);

  useEffect(() => { reload(); }, [reload]);

  const filtered = search
    ? sales.filter(s => s.id.toLowerCase().startsWith(search.toLowerCase()) || (s.member?.name?.toLowerCase().includes(search.toLowerCase())))
    : sales;

  const totalPeriod = filtered.reduce((s, x) => s + x.total, 0);

  const pmBadge: Record<string, string> = {
    dinheiro: 'bg-emerald-500/20 text-emerald-400',
    cartão: 'bg-orange-500/20 text-orange-400',
    pix: 'bg-blue-500/20 text-blue-400',
  };
  const pmLabel: Record<string, string> = { dinheiro: 'Dinheiro', cartão: 'Cartão', pix: 'Pix' };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <History className="w-7 h-7 text-accent" />
          <h1 className="text-2xl font-bold text-white">Histórico de Vendas</h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase">Total no período</p>
          <p className="text-xl font-bold text-accent">{formatCurrency(totalPeriod)}</p>
        </div>
      </div>

      <div className="dark-card p-4 mb-4">
        <div className="grid grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase">Data início</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="dark-input pl-9 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase">Data fim</label>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="dark-input pl-9 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase">Cliente</label>
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <select value={memberFilter} onChange={e => setMemberFilter(e.target.value)} className="dark-select pl-9 text-sm">
                <option value="">Todos</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            {(startDate || endDate || memberFilter) && (
              <button onClick={() => { setStartDate(''); setEndDate(''); setMemberFilter(''); }} className="btn-ghost text-sm w-full flex items-center gap-1.5 justify-center">
                <X className="w-4 h-4" /> Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input type="text" placeholder="Buscar por ID ou nome do cliente..." value={search} onChange={e => setSearch(e.target.value)} className="dark-input pl-9" />
      </div>

      <p className="text-sm text-gray-600 mb-3">{filtered.length} {filtered.length === 1 ? 'venda' : 'vendas'} encontradas</p>

      {filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">Nenhuma venda encontrada.</div>
      ) : (
        <div className="flex-1 overflow-auto space-y-1.5">
          {filtered.map((sale, idx) => {
            const isExpanded = expandedSale === sale.id;
            return (
              <div key={sale.id} className="dark-card overflow-hidden">
                <button
                  onClick={() => setExpandedSale(isExpanded ? null : sale.id)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-dark-500/50 transition-colors"
                >
                  <span className="text-gray-600 text-sm w-6 text-right flex-shrink-0">{idx + 1}</span>
                  <div className="w-9 h-9 rounded-lg bg-dark-400 flex items-center justify-center flex-shrink-0">
                    <Receipt className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-500">#{sale.id.slice(0, 8).toUpperCase()}</span>
                      <span className="text-xs text-gray-600">{formatDate(sale.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`badge-pill ${pmBadge[sale.payment_method] ?? 'bg-dark-300 text-gray-400'}`}>{pmLabel[sale.payment_method] ?? sale.payment_method}</span>
                      {sale.member && <span className="badge-pill bg-dark-300 text-gray-400">{sale.member.name}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white">{formatCurrency(sale.total)}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-dark-400">
                    <table className="w-full table-dark mt-0">
                      <thead>
                        <tr><th>ITEM</th><th className="text-center">QTD</th><th className="text-right">UNIT.</th><th className="text-right">SUBTOTAL</th></tr>
                      </thead>
                      <tbody>
                        {sale.sale_items.map(item => (
                          <tr key={item.id}>
                            <td className="text-white">{item.product_name}</td>
                            <td className="text-center text-gray-400">{item.quantity}</td>
                            <td className="text-right text-gray-400">{formatCurrency(item.unit_price)}</td>
                            <td className="text-right font-semibold text-accent-light">{formatCurrency(item.total_price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {sale.member && (
                      <div className="mt-3 pt-3 border-t border-dark-400 text-xs text-gray-500">
                        Cliente: {sale.member.name} · Matrícula: {sale.member.registration_number} · CPF: {formatCPF(sale.member.cpf)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
