import { useState, useEffect, useCallback } from 'react';
import {
  getActiveProducts,
  insertProduct,
  updateProduct,
  softDeleteProduct,
  getActiveCategories,
} from '../lib/db';
import { Product, ProductCategory, formatCurrency } from '../lib/types';
import { Package, Plus, Pencil, Trash2, Search, X, AlertTriangle, Filter } from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ value: string; label: string; group: string }[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: '',
    barcode: '',
    price: '',
    category: 'kimono' as ProductCategory,
    stock: '0',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reload = useCallback(() => {
    setProducts(getActiveProducts());
    setCategories(getActiveCategories());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const filtered = products
    .filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search);

      const matchesCategory =
        categoryFilter === 'todas' || p.category === categoryFilter;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const categoryA = catLabel(a.category);
      const categoryB = catLabel(b.category);

      if (categoryA !== categoryB) {
        return categoryA.localeCompare(categoryB);
      }

      return a.name.localeCompare(b.name);
    });

  function openForm(p?: Product) {
    const defaultCategory = categories[0]?.value || 'kimono';

    setEditing(p ?? null);

    setForm(
      p
        ? {
            name: p.name,
            barcode: p.barcode,
            price: String(p.price),
            category: p.category,
            stock: String(p.stock),
          }
        : {
            name: '',
            barcode: '',
            price: '',
            category: defaultCategory,
            stock: '0',
          }
    );

    setError('');
    setShowForm(true);
  }

  function handleSave() {
    setSaving(true);
    setError('');

    const payload = {
      name: form.name.trim(),
      barcode: form.barcode.trim(),
      price: parseFloat(form.price),
      category: form.category,
      stock: parseInt(form.stock) || 0,
    };

    if (!payload.name || !payload.barcode || isNaN(payload.price) || payload.price < 0) {
      setError('Preencha nome, código de barras e preço válidos.');
      setSaving(false);
      return;
    }

    if (editing) {
      updateProduct(editing.id, payload);
    } else {
      const { error: err } = insertProduct(payload);

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

  function handleDelete(p: Product) {
    if (!confirm(`Remover "${p.name}"?`)) return;

    softDeleteProduct(p.id);
    reload();
  }

  function catLabel(c: ProductCategory) {
    return categories.find(x => x.value === c)?.label ?? c;
  }

  const catColors: Record<string, string> = {
    kimono: 'bg-red-500/20 text-red-400',
    rashguard: 'bg-rose-500/20 text-rose-400',
    shorts: 'bg-pink-500/20 text-pink-400',
    faixa: 'bg-accent/20 text-accent-light',
    protetor: 'bg-orange-500/20 text-orange-400',
    suplemento: 'bg-green-500/20 text-green-400',
    acessorio: 'bg-yellow-500/20 text-yellow-400',
    cerveja: 'bg-amber-500/20 text-amber-400',
    refrigerante: 'bg-blue-500/20 text-blue-400',
    água: 'bg-cyan-500/20 text-cyan-400',
    destilado: 'bg-purple-500/20 text-purple-400',
    vinho: 'bg-rose-500/20 text-rose-400',
    petisco: 'bg-indigo-500/20 text-indigo-400',
    outro: 'bg-gray-500/20 text-gray-400',
  };

  const groupedCategories = Array.from(new Set(categories.map(c => c.group)));

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package className="w-7 h-7 text-accent" />
          <h1 className="text-2xl font-bold text-white">Produtos</h1>
          <span className="badge-pill bg-dark-400 text-gray-400">
            {filtered.length} / {products.length}
          </span>
        </div>

        <button onClick={() => openForm()} className="btn-accent">
          <Plus className="w-4 h-4" />
          Novo Produto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou código de barras..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="dark-input pl-9"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="dark-select pl-9"
          >
            <option value="todas">Todas as categorias</option>

            {groupedCategories.map(group => (
              <optgroup key={group} label={group}>
                {categories
                  .filter(c => c.group === group)
                  .map(c => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto dark-card">
        <table className="w-full table-dark">
          <thead>
            <tr>
              <th>PRODUTO</th>
              <th>CÓDIGO DE BARRAS</th>
              <th>CATEGORIA</th>
              <th className="text-right">PREÇO</th>
              <th className="text-right">ESTOQUE</th>
              <th className="text-right">AÇÕES</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-12">
                  {search || categoryFilter !== 'todas'
                    ? 'Nenhum produto encontrado com esse filtro.'
                    : 'Nenhum produto cadastrado.'}
                </td>
              </tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id}>
                  <td className="font-medium text-white">{p.name}</td>
                  <td className="font-mono text-xs text-gray-500">{p.barcode}</td>
                  <td>
                    <span className={`badge-pill ${catColors[p.category] ?? catColors.outro}`}>
                      {catLabel(p.category)}
                    </span>
                  </td>
                  <td className="text-right font-semibold text-accent-light">
                    {formatCurrency(p.price)}
                  </td>
                  <td className="text-right">
                    <div
                      className={`inline-flex items-center gap-1 ${
                        p.stock <= 5 ? 'text-red-400' : 'text-gray-300'
                      }`}
                    >
                      {p.stock <= 5 && <AlertTriangle className="w-3 h-3" />}
                      {p.stock}
                    </div>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openForm(p)}
                        className="p-1.5 rounded-md hover:bg-dark-400 text-gray-500 hover:text-white transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(p)}
                        className="p-1.5 rounded-md hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-dark-600 border border-dark-300 rounded-xl p-6 w-full max-w-md shadow-dark-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">
                {editing ? 'Editar Produto' : 'Novo Produto'}
              </h2>

              <button
                onClick={() => setShowForm(false)}
                className="p-1.5 rounded-md hover:bg-dark-400 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Nome
                </label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="dark-input"
                  placeholder="Ex: Kimono Arena Classic"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Código de Barras
                </label>
                <input
                  value={form.barcode}
                  onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))}
                  className="dark-input font-mono"
                  placeholder="Ex: 7891234500001"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="dark-input"
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">
                    Estoque
                  </label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                    className="dark-input"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Categoria
                </label>

                <select
                  value={form.category}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      category: e.target.value as ProductCategory,
                    }))
                  }
                  className="dark-select"
                >
                  {groupedCategories.map(group => (
                    <optgroup key={group} label={group}>
                      {categories
                        .filter(c => c.group === group)
                        .map(c => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
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
                {saving ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Cadastrar Produto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}