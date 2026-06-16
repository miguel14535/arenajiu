import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Tags, X, AlertTriangle } from 'lucide-react';
import {
  getActiveCategories,
  insertCategory,
  updateCategory,
  softDeleteCategory,
} from '../lib/db';
import type { Category } from '../lib/types';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    label: '',
    value: '',
    group: '',
  });
  const [error, setError] = useState('');

  function reload() {
    setCategories(getActiveCategories());
  }

  useEffect(() => {
    reload();
  }, []);

  function normalizeValue(text: string) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function openForm(category?: Category) {
    setError('');

    if (category) {
      setEditingId(category.id);
      setForm({
        label: category.label,
        value: category.value,
        group: category.group,
      });
    } else {
      setEditingId(null);
      setForm({
        label: '',
        value: '',
        group: '',
      });
    }

    setShowForm(true);
  }

  function handleLabelChange(value: string) {
    setForm(prev => ({
      ...prev,
      label: value,
      value: editingId ? prev.value : normalizeValue(value),
    }));
  }

  function handleSave() {
    setError('');

    const payload = {
      label: form.label.trim(),
      value: form.value.trim(),
      group: form.group.trim() || 'Outros',
    };

    if (!payload.label) {
      setError('Informe o nome da categoria.');
      return;
    }

    if (!payload.value) {
      setError('Informe o identificador da categoria.');
      return;
    }

    if (editingId) {
      updateCategory(editingId, payload);
    } else {
      const { error: err } = insertCategory(payload);

      if (err) {
        setError(err);
        return;
      }
    }

    setShowForm(false);
    reload();
  }

  function handleDelete(category: Category) {
    if (!confirm(`Remover a categoria "${category.label}"?`)) return;

    softDeleteCategory(category.id);
    reload();
  }

  const grouped = categories.reduce<Record<string, Category[]>>((acc, category) => {
    if (!acc[category.group]) acc[category.group] = [];
    acc[category.group].push(category);
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Tags className="w-7 h-7 text-accent" />
          <h1 className="text-2xl font-bold text-white">Categorias</h1>
          <span className="badge-pill bg-dark-400 text-gray-400">
            {categories.length}
          </span>
        </div>

        <button onClick={() => openForm()} className="btn-accent">
          <Plus className="w-4 h-4" />
          Nova Categoria
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Nenhuma categoria cadastrada.
        </div>
      ) : (
        <div className="space-y-6 overflow-auto">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} className="dark-card p-5">
              <h2 className="text-lg font-bold text-white mb-4">{group}</h2>

              <div className="space-y-2">
                {items.map(category => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between bg-dark-500 border border-dark-300 rounded-lg px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-white">{category.label}</p>
                      <p className="text-xs text-gray-500">
                        Código: {category.value}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openForm(category)}
                        className="p-1.5 rounded-md hover:bg-dark-400 text-gray-500 hover:text-white transition-colors"
                        title="Editar categoria"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(category)}
                        className="p-1.5 rounded-md hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-colors"
                        title="Remover categoria"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

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
                {editingId ? 'Editar Categoria' : 'Nova Categoria'}
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
                  Nome da categoria
                </label>
                <input
                  value={form.label}
                  onChange={e => handleLabelChange(e.target.value)}
                  className="dark-input"
                  placeholder="Ex: Luvas, Energéticos, Camisetas"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Código interno
                </label>
                <input
                  value={form.value}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      value: normalizeValue(e.target.value),
                    }))
                  }
                  className="dark-input"
                  placeholder="Ex: luvas"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Esse código será usado internamente pelo sistema.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Grupo
                </label>
                <input
                  value={form.group}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      group: e.target.value,
                    }))
                  }
                  className="dark-input"
                  placeholder="Ex: Equipamentos, Bebidas, Alimentação"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </p>
              )}

              <button
                onClick={handleSave}
                className="btn-accent w-full justify-center py-3"
              >
                {editingId ? 'Salvar Alterações' : 'Cadastrar Categoria'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}