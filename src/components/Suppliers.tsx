import { useState, useEffect, useCallback } from 'react';
import { getActiveSuppliers, insertSupplier, updateSupplier, softDeleteSupplier } from '../lib/db';
import { Supplier } from '../lib/types';
import { Truck, Plus, Pencil, Trash2, Search, X, AlertTriangle, Mail, Phone, Building2 } from 'lucide-react';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: '', cnpj: '', contact_name: '', phone: '', email: '' });
  const [error, setError] = useState('');

  const reload = useCallback(() => setSuppliers(getActiveSuppliers()), []);
  useEffect(() => { reload(); }, [reload]);

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.cnpj ?? '').includes(search) ||
    (s.contact_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  function openForm(s?: Supplier) {
    setEditing(s ?? null);
    setForm(s ? { name: s.name, cnpj: s.cnpj ?? '', contact_name: s.contact_name ?? '', phone: s.phone ?? '', email: s.email ?? '' }
            : { name: '', cnpj: '', contact_name: '', phone: '', email: '' });
    setError(''); setShowForm(true);
  }

  function handleSave() {
    const payload = {
      name: form.name.trim(),
      cnpj: form.cnpj.trim() || null,
      contact_name: form.contact_name.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
    };
    if (!payload.name) { setError('Informe o nome do fornecedor.'); return; }
    if (editing) {
      updateSupplier(editing.id, payload);
    } else {
      insertSupplier(payload);
    }
    setShowForm(false); reload();
  }

  function handleDelete(s: Supplier) {
    if (!confirm(`Remover fornecedor "${s.name}"?`)) return;
    softDeleteSupplier(s.id); reload();
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Truck className="w-7 h-7 text-accent" />
          <h1 className="text-2xl font-bold text-white">Fornecedores</h1>
          <span className="badge-pill bg-dark-400 text-gray-400">{suppliers.length}</span>
        </div>
        <button onClick={() => openForm()} className="btn-accent"><Plus className="w-4 h-4" /> Novo Fornecedor</button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input type="text" placeholder="Buscar por nome, CNPJ ou contato..." value={search} onChange={e => setSearch(e.target.value)} className="dark-input pl-9" />
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
          <Truck className="w-14 h-14 mb-3 opacity-20" />
          <p>{search ? 'Nenhum fornecedor encontrado.' : 'Nenhum fornecedor cadastrado.'}</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full table-dark dark-card">
            <thead>
              <tr>
                <th>FORNECEDOR</th><th>CNPJ</th><th>CONTATO</th><th>TELEFONE</th><th>E-MAIL</th><th className="text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-dark-400 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-gray-500" />
                      </div>
                      <span className="font-medium text-white">{s.name}</span>
                    </div>
                  </td>
                  <td className="font-mono text-xs text-gray-500">{s.cnpj ?? '—'}</td>
                  <td className="text-gray-300">{s.contact_name ?? '—'}</td>
                  <td>{s.phone ? <div className="flex items-center gap-1 text-gray-400 text-xs"><Phone className="w-3 h-3" />{s.phone}</div> : '—'}</td>
                  <td>{s.email ? <div className="flex items-center gap-1 text-gray-400 text-xs"><Mail className="w-3 h-3" />{s.email}</div> : '—'}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openForm(s)} className="p-1.5 rounded-md hover:bg-dark-400 text-gray-500 hover:text-white transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(s)} className="p-1.5 rounded-md hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-dark-600 border border-dark-300 rounded-xl p-6 w-full max-w-md shadow-dark-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{editing ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-md hover:bg-dark-400 text-gray-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Nome *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="dark-input" placeholder="Ex: Distribuidora Arena" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">CNPJ</label>
                <input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} className="dark-input font-mono" placeholder="00.000.000/0000-00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Nome do Contato</label>
                <input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} className="dark-input" placeholder="Ex: João Silva" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Telefone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="dark-input" placeholder="(00) 00000-0000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">E-mail</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="dark-input" placeholder="email@empresa.com" />
                </div>
              </div>
              {error && <p className="text-red-400 text-sm flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" />{error}</p>}
              <button onClick={handleSave} className="btn-accent w-full justify-center py-3">
                {editing ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
