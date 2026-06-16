import { useState, useEffect, useCallback } from 'react';
import {
  getMembersWithPlans,
  MemberWithPlans,
  insertMember,
  updateMember,
  softDeleteMember,
  insertPlan,
  updatePlan,
  getPendingSalesByMember,
  getMemberDebt,
  markSaleAsPaid,
  SaleWithDetails,
} from '../lib/db';
import {
  Plan,
  PlanType,
  PLAN_TYPES,
  formatCurrency,
  formatCPF,
  formatCEP,
  formatDateShort,
  formatDate,
} from '../lib/types';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  CreditCard,
  AlertTriangle,
  MessageSquare,
  Clock,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
} from 'lucide-react';

export default function Members() {
  const [members, setMembers] = useState<MemberWithPlans[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planMember, setPlanMember] = useState<MemberWithPlans | null>(null);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    cpf: '',
    registration_number: '',
    phone: '',
    cep: '',
    street: '',
    house_number: '',
    complement: '',
    city: '',
  });

  const [planForm, setPlanForm] = useState<{
    plan_type: PlanType;
    price: string;
    payment_date: string;
  }>({
    plan_type: 'mensal',
    price: '',
    payment_date: new Date().toISOString().split('T')[0],
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reload = useCallback(() => {
    setMembers(getMembersWithPlans());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.cpf.includes(search) ||
    m.registration_number.toLowerCase().includes(search.toLowerCase()) ||
    (m.street ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (m.city ?? '').toLowerCase().includes(search.toLowerCase())
  );

  function enviarWhatsApp(member: MemberWithPlans) {
    if (!member.phone) {
      alert('Este cliente não possui telefone cadastrado.');
      return;
    }

    const numero = member.phone.replace(/\D/g, '');

    if (!numero) {
      alert('Telefone inválido.');
      return;
    }

    const ultimoPlano = [...member.plans]
      .sort((a, b) => b.end_date.localeCompare(a.end_date))[0];

    const dataVencimento = ultimoPlano?.end_date
      ? formatDateShort(ultimoPlano.end_date + 'T12:00:00')
      : 'data não informada';

    const mensagem = `Olá, ${member.name}!

Identificamos que o seu plano na Arena Jiu-Jitsu venceu em ${dataVencimento}.

Gostaríamos muito de continuar contando com você nos treinos. Entre em contato para regularizar sua matrícula e voltar ao tatame.

Estamos à disposição.

Oss!`;

    window.open(
      `https://wa.me/55${numero}?text=${encodeURIComponent(mensagem)}`,
      '_blank'
    );
  }

  function openForm(m?: MemberWithPlans) {
    setEditingId(m?.id ?? null);

    setForm(
      m
        ? {
            name: m.name,
            cpf: m.cpf,
            registration_number: m.registration_number,
            phone: m.phone || '',
            cep: m.cep || '',
            street: m.street || '',
            house_number: m.house_number || '',
            complement: m.complement || '',
            city: m.city || '',
          }
        : {
            name: '',
            cpf: '',
            registration_number: '',
            phone: '',
            cep: '',
            street: '',
            house_number: '',
            complement: '',
            city: '',
          }
    );

    setError('');
    setShowForm(true);
  }

  function getLatestPlan(plans: Plan[]): Plan | undefined {
    return [...plans].sort((a, b) => b.end_date.localeCompare(a.end_date))[0];
  }

  function openPlanForm(m: MemberWithPlans) {
    const latestPlan = getLatestPlan(m.plans);
    const today = new Date().toISOString().split('T')[0];
    const paymentDate = latestPlan?.payment_date ?? latestPlan?.start_date ?? today;

    setPlanMember(m);
    setEditingPlanId(latestPlan?.id ?? null);

    setPlanForm({
      plan_type: latestPlan?.plan_type ?? 'mensal',
      price: latestPlan ? String(latestPlan.price) : '',
      payment_date: paymentDate,
    });

    setError('');
    setShowPlanForm(true);
  }

  function handleSave() {
    setSaving(true);
    setError('');

    const payload = {
      name: form.name.trim(),
      cpf: form.cpf.replace(/\D/g, ''),
      registration_number: form.registration_number.trim(),
      phone: form.phone.trim() || null,
      cep: form.cep.replace(/\D/g, ''),
      street: form.street.trim(),
      house_number: form.house_number.trim(),
      complement: form.complement.trim(),
      city: form.city.trim(),
    };

    if (!payload.name || !payload.cpf) {
      setError('Preencha nome completo e CPF.');
      setSaving(false);
      return;
    }

    if (payload.cpf.length !== 11) {
      setError('CPF deve ter 11 dígitos.');
      setSaving(false);
      return;
    }

    if (!payload.cep || !payload.street || !payload.house_number || !payload.city) {
      setError('Preencha o endereço completo: CEP, rua, número e cidade.');
      setSaving(false);
      return;
    }

    if (payload.cep.length !== 8) {
      setError('CEP deve ter 8 dígitos.');
      setSaving(false);
      return;
    }

    if (editingId) {
      const { error: err } = updateMember(editingId, payload);

      if (err) {
        setError(err);
        setSaving(false);
        return;
      }
    } else {
      const { error: err } = insertMember({
        ...payload,
        registration_number: '',
      });

      if (err) {
        setError(err);
        setSaving(false);
        return;
      }
    }

    setShowForm(false);
    reload();
    setSaving(false);
  }

  function handleSavePlan() {
    if (!planMember) return;

    setSaving(true);
    setError('');

    const price = parseFloat(planForm.price);

    if (isNaN(price) || price <= 0) {
      setError('Informe um preço válido.');
      setSaving(false);
      return;
    }

    if (!planForm.payment_date) {
      setError('Informe a data de pagamento.');
      setSaving(false);
      return;
    }

    const start = new Date(planForm.payment_date + 'T12:00:00');
    const end = new Date(start);

    if (planForm.plan_type === 'mensal') {
      end.setMonth(end.getMonth() + 1);
    } else if (planForm.plan_type === 'trimestral') {
      end.setMonth(end.getMonth() + 3);
    } else if (planForm.plan_type === 'semestral') {
      end.setMonth(end.getMonth() + 6);
    } else {
      end.setFullYear(end.getFullYear() + 1);
    }

    const payload = {
      member_id: planMember.id,
      plan_type: planForm.plan_type,
      price,
      payment_date: planForm.payment_date,
      start_date: planForm.payment_date,
      end_date: end.toISOString().split('T')[0],
    };

    if (editingPlanId) {
      updatePlan(editingPlanId, payload);
    } else {
      insertPlan(payload);
    }

    setShowPlanForm(false);
    setEditingPlanId(null);
    reload();
    setSaving(false);
  }

  function handleDelete(m: MemberWithPlans) {
    if (!confirm(`Remover cliente "${m.name}"?`)) return;

    softDeleteMember(m.id);
    reload();
  }

  function handleMarkSaleAsPaid(sale: SaleWithDetails) {
    if (!confirm(`Marcar esta pendência de ${formatCurrency(sale.total)} como paga?`)) return;

    markSaleAsPaid(sale.id);
    reload();
  }

  const planLabel = (t: PlanType) =>
    PLAN_TYPES.find(p => p.value === t)?.label ?? t;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7 text-accent" />
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <span className="badge-pill bg-dark-400 text-gray-400">
            {members.length}
          </span>
        </div>

        <button onClick={() => openForm()} className="btn-accent">
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar por nome, CPF, matrícula, rua ou cidade..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="dark-input pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          {search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}
        </div>
      ) : (
        <div className="flex-1 overflow-auto space-y-2">
          {filtered.map(m => {
            const activePlan = m.plans.find(
              p => p.active && new Date(p.end_date) >= new Date()
            );

            const pendingSales = getPendingSalesByMember(m.id);
            const debt = getMemberDebt(m.id);
            const hasDebt = debt > 0;
            const expanded = expandedMemberId === m.id;

            return (
              <div
                key={m.id}
                className="dark-card p-4 hover:bg-dark-500 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-dark-400 border border-dark-300 flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-300">
                        {m.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <p className="font-semibold text-white">{m.name}</p>

                      <p className="text-xs text-gray-500">
                        Mat. {m.registration_number} · CPF: {formatCPF(m.cpf)}
                        {m.phone ? ` · ${m.phone}` : ''}
                      </p>

                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {m.street || 'Rua não informada'}, {m.house_number || 's/n'}
                        {m.complement ? ` · ${m.complement}` : ''} · {m.city || 'Cidade não informada'} · CEP: {m.cep ? formatCEP(m.cep) : 'não informado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => enviarWhatsApp(m)}
                      className="p-1.5 rounded-md hover:bg-green-900/30 text-gray-500 hover:text-green-400 transition-colors"
                      title="Enviar WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => openPlanForm(m)}
                      className="p-1.5 rounded-md hover:bg-accent/20 text-gray-500 hover:text-accent transition-colors"
                      title={m.plans.length > 0 ? 'Editar plano' : 'Adicionar plano'}
                    >
                      <CreditCard className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => openForm(m)}
                      className="p-1.5 rounded-md hover:bg-dark-400 text-gray-500 hover:text-white transition-colors"
                      title="Editar cliente"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(m)}
                      className="p-1.5 rounded-md hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-colors"
                      title="Remover cliente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {activePlan ? (
                    <>
                      <span className="badge-pill bg-emerald-500/20 text-emerald-400">
                        {planLabel(activePlan.plan_type)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatCurrency(activePlan.price)} · pago em{' '}
                        {formatDateShort((activePlan.payment_date ?? activePlan.start_date) + 'T12:00:00')} · válido até{' '}
                        {formatDateShort(activePlan.end_date + 'T12:00:00')}
                      </span>
                    </>
                  ) : m.plans.length > 0 ? (
                    <span className="badge-pill bg-yellow-500/20 text-yellow-400">
                      Plano vencido
                    </span>
                  ) : (
                    <span className="badge-pill bg-dark-400 text-gray-500">
                      Sem plano
                    </span>
                  )}

                  {hasDebt ? (
                    <button
                      onClick={() => setExpandedMemberId(expanded ? null : m.id)}
                      className="badge-pill bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center gap-1"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Devendo {formatCurrency(debt)}
                      {expanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ) : (
                    <span className="badge-pill bg-emerald-500/10 text-emerald-400">
                      Sem pendências
                    </span>
                  )}
                </div>

                {expanded && hasDebt && (
                  <div className="mt-4 border-t border-dark-300 pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-white">
                        Compras pendentes
                      </p>
                      <p className="text-sm font-bold text-red-400">
                        Total: {formatCurrency(debt)}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {pendingSales.map(sale => (
                        <div
                          key={sale.id}
                          className="bg-dark-700 border border-dark-300 rounded-xl p-3"
                        >
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div>
                              <p className="text-sm font-semibold text-white">
                                Compra feita em {formatDate(sale.created_at)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Forma selecionada: {sale.payment_method}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-sm font-bold text-red-400">
                                {formatCurrency(sale.total)}
                              </p>
                              <button
                                onClick={() => handleMarkSaleAsPaid(sale)}
                                className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Marcar como pago
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            {sale.sale_items.map(item => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between text-xs text-gray-400"
                              >
                                <span>
                                  {item.quantity}x {item.product_name}
                                </span>
                                <span>
                                  {formatCurrency(item.total_price)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-dark-600 border border-dark-300 rounded-xl p-6 w-full max-w-2xl shadow-dark-lg max-h-[90vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">
                {editingId ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>

              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-md hover:bg-dark-400 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {!editingId && (
                <div className="bg-dark-700 border border-dark-300 rounded-lg p-3">
                  <p className="text-xs text-gray-400">
                    A matrícula será gerada automaticamente no formato 001, 002, 003...
                  </p>
                </div>
              )}

              {editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    Matrícula
                  </label>
                  <input
                    value={form.registration_number}
                    disabled
                    className="dark-input opacity-70 cursor-not-allowed"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Nome completo *
                </label>
                <input
                  value={form.name}
                  onChange={e =>
                    setForm(f => ({ ...f, name: e.target.value }))
                  }
                  className="dark-input"
                  placeholder="Nome completo"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    CPF *
                  </label>
                  <input
                    value={form.cpf}
                    onChange={e =>
                      setForm(f => ({
                        ...f,
                        cpf: e.target.value.replace(/\D/g, '').slice(0, 11),
                      }))
                    }
                    className="dark-input font-mono"
                    placeholder="00000000000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    Telefone
                  </label>
                  <input
                    value={form.phone}
                    onChange={e =>
                      setForm(f => ({ ...f, phone: e.target.value }))
                    }
                    className="dark-input"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="border-t border-dark-300 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-accent" />
                  <h3 className="text-sm font-bold text-white">
                    Endereço obrigatório
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">
                      CEP *
                    </label>
                    <input
                      value={form.cep}
                      onChange={e =>
                        setForm(f => ({
                          ...f,
                          cep: e.target.value.replace(/\D/g, '').slice(0, 8),
                        }))
                      }
                      className="dark-input font-mono"
                      placeholder="00000000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">
                      Cidade *
                    </label>
                    <input
                      value={form.city}
                      onChange={e =>
                        setForm(f => ({ ...f, city: e.target.value }))
                      }
                      className="dark-input"
                      placeholder="Ex: Campo Bom"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">
                      Rua *
                    </label>
                    <input
                      value={form.street}
                      onChange={e =>
                        setForm(f => ({ ...f, street: e.target.value }))
                      }
                      className="dark-input"
                      placeholder="Nome da rua"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">
                      Número *
                    </label>
                    <input
                      value={form.house_number}
                      onChange={e =>
                        setForm(f => ({ ...f, house_number: e.target.value }))
                      }
                      className="dark-input"
                      placeholder="Ex: 123"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    Complemento
                  </label>
                  <input
                    value={form.complement}
                    onChange={e =>
                      setForm(f => ({ ...f, complement: e.target.value }))
                    }
                    className="dark-input"
                    placeholder="Apartamento, bloco, referência..."
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </p>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-accent w-full justify-center py-3"
              >
                {saving
                  ? 'Salvando...'
                  : editingId
                  ? 'Salvar Alterações'
                  : 'Cadastrar Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPlanForm && planMember && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setShowPlanForm(false)}
        >
          <div
            className="bg-dark-600 border border-dark-300 rounded-xl p-6 w-full max-w-md shadow-dark-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">
                {editingPlanId ? 'Editar Plano' : 'Novo Plano'}
              </h2>

              <button
                onClick={() => setShowPlanForm(false)}
                className="p-1.5 rounded-md hover:bg-dark-400 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-4">{planMember.name}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Tipo de Plano
                </label>
                <select
                  value={planForm.plan_type}
                  onChange={e =>
                    setPlanForm(f => ({
                      ...f,
                      plan_type: e.target.value as PlanType,
                    }))
                  }
                  className="dark-select"
                >
                  {PLAN_TYPES.map(p => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={planForm.price}
                    onChange={e =>
                      setPlanForm(f => ({
                        ...f,
                        price: e.target.value,
                      }))
                    }
                    className="dark-input"
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    Data de Pagamento
                  </label>
                  <input
                    type="date"
                    value={planForm.payment_date}
                    onChange={e =>
                      setPlanForm(f => ({
                        ...f,
                        payment_date: e.target.value,
                      }))
                    }
                    className="dark-input"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </p>
              )}

              <button
                onClick={handleSavePlan}
                disabled={saving}
                className="btn-accent w-full justify-center py-3"
              >
                {saving ? 'Salvando...' : editingPlanId ? 'Salvar Alterações' : 'Cadastrar Plano'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
