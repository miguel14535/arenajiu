import { useState } from 'react';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Products from './components/Products';
import Members from './components/Members';
import SalesHistory from './components/SalesHistory';
import Suppliers from './components/Suppliers';
import Categories from './components/Categories';
import {
  LayoutDashboard, ShoppingCart, History, Package,
  Users, Truck, BarChart2, HardDrive, Settings, Tags,
} from 'lucide-react';

type Tab =
  | 'dashboard'
  | 'pos'
  | 'history'
  | 'products'
  | 'members'
  | 'suppliers'
  | 'categories'
  | 'reports'
  | 'backup'
  | 'settings';

const navItems: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pos', label: 'Nova Venda', icon: ShoppingCart },
  { id: 'history', label: 'Histórico de Vendas', icon: History },
  { id: 'products', label: 'Produtos', icon: Package },
  { id: 'members', label: 'Clientes', icon: Users },
  { id: 'suppliers', label: 'Fornecedores', icon: Truck },
  { id: 'categories', label: 'Categorias', icon: Tags },
  { id: 'reports', label: 'Relatórios', icon: BarChart2 },
  { id: 'backup', label: 'Backup / Exportar', icon: HardDrive },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  function navigate(tab: string) {
    setActiveTab(tab as Tab);
  }

  return (
    <div className="h-screen flex overflow-hidden bg-dark-800">
      <aside className="w-60 flex-shrink-0 bg-dark-900 border-r border-dark-300 flex flex-col">
        <div className="px-5 pt-5 pb-4 border-b border-dark-300">
          <div className="flex flex-col items-center gap-2">
            <img
              src="/{53F6E780-FAFC-414B-90EF-9A5E0AB684CB}.png"
              alt="Arena Jiu Jitsu"
              className="w-24 h-24 object-contain drop-shadow-lg"
            />
            <div className="text-center">
              <p className="text-gray-500 text-xs leading-tight tracking-widest uppercase">
                Sistema de Controle<br />de Vendas
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-auto">
          {navItems.slice(0, 7).map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`sidebar-item w-full ${activeTab === item.id ? 'active' : ''}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="my-2 border-t border-dark-300" />

          {navItems.slice(7).map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`sidebar-item w-full ${activeTab === item.id ? 'active' : ''}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-dark-300">
          <div className="bg-dark-600 rounded-lg p-3">
            <p className="text-xs font-bold text-white mb-0.5">Arena Jiu Jitsu</p>
            <p className="text-xs text-gray-500 mb-2">Versão 2.0.0</p>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-gray-400">Sistema Online</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden p-6">
          {activeTab === 'dashboard' && <Dashboard onNavigate={navigate} />}
          {activeTab === 'pos' && <POS />}
          {activeTab === 'history' && <SalesHistory />}
          {activeTab === 'products' && <Products />}
          {activeTab === 'members' && <Members />}
          {activeTab === 'suppliers' && <Suppliers />}
          {activeTab === 'categories' && <Categories />}
          {activeTab === 'reports' && <ReportsPlaceholder onNavigate={navigate} />}
          {activeTab === 'backup' && <BackupPlaceholder />}
          {activeTab === 'settings' && <SettingsPlaceholder />}
        </div>
      </main>
    </div>
  );
}

function ReportsPlaceholder({ onNavigate }: { onNavigate: (t: string) => void }) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <BarChart2 className="w-7 h-7 text-accent" />
        <h1 className="text-2xl font-bold text-white">Relatórios</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { title: 'Vendas por Período', sub: 'Filtrar e exportar vendas', tab: 'history' },
          { title: 'Produtos Mais Vendidos', sub: 'Ver ranking no Dashboard', tab: 'dashboard' },
          { title: 'Clientes Frequentes', sub: 'Ver clientes ativos', tab: 'members' },
          { title: 'Estoque Atual', sub: 'Gerenciar produtos', tab: 'products' },
        ].map(r => (
          <button
            key={r.title}
            onClick={() => onNavigate(r.tab)}
            className="dark-card p-5 text-left hover:bg-dark-500 transition-colors"
          >
            <p className="font-semibold text-white">{r.title}</p>
            <p className="text-sm text-gray-500 mt-1">{r.sub}</p>
            <span className="text-xs text-accent mt-2 block">Acessar →</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function BackupPlaceholder() {
  function exportBackup() {
    const backup: Record<string, unknown> = {};

    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('arena_')) {
        backup[key] = JSON.parse(localStorage.getItem(key) ?? '[]');
      }
    }

    const blob = new Blob(
      [JSON.stringify(backup, null, 2)],
      { type: 'application/json' }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `backup-arena-jiujitsu-${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  function exportSalesReport() {
    const sales = JSON.parse(localStorage.getItem('arena_sales') || '[]');
    const saleItems = JSON.parse(localStorage.getItem('arena_sale_items') || '[]');
    const members = JSON.parse(localStorage.getItem('arena_members') || '[]');

    const rows: string[] = [];

    rows.push('RELATÓRIO DE VENDAS - ARENA JIU JITSU');
    rows.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
    rows.push('');
    rows.push('Data;Cliente;Forma de Pagamento;Produto;Quantidade;Valor Unitário;Total do Item;Total da Venda');

    let totalGeral = 0;
    let totalItens = 0;

    sales.forEach((sale: any) => {
      const cliente = sale.member_id
        ? members.find((m: any) => m.id === sale.member_id)?.name || 'Cliente não encontrado'
        : 'Cliente avulso';

      const itensDaVenda = saleItems.filter((item: any) => item.sale_id === sale.id);

      totalGeral += Number(sale.total || 0);

      if (itensDaVenda.length === 0) {
        rows.push([
          new Date(sale.created_at).toLocaleString('pt-BR'),
          cliente,
          sale.payment_method || '',
          'Venda sem itens detalhados',
          '',
          '',
          '',
          Number(sale.total || 0).toFixed(2).replace('.', ','),
        ].join(';'));
      } else {
        itensDaVenda.forEach((item: any) => {
          totalItens += Number(item.quantity || 0);

          rows.push([
            new Date(sale.created_at).toLocaleString('pt-BR'),
            cliente,
            sale.payment_method || '',
            item.product_name || '',
            item.quantity || 0,
            Number(item.unit_price || 0).toFixed(2).replace('.', ','),
            Number(item.total_price || 0).toFixed(2).replace('.', ','),
            Number(sale.total || 0).toFixed(2).replace('.', ','),
          ].join(';'));
        });
      }
    });

    rows.push('');
    rows.push('RESUMO');
    rows.push(`Total de vendas;${sales.length}`);
    rows.push(`Total de itens vendidos;${totalItens}`);
    rows.push(`Faturamento total;R$ ${totalGeral.toFixed(2).replace('.', ',')}`);

    const csv = rows.join('\n');

    const blob = new Blob(
      ['\uFEFF' + csv],
      { type: 'text/csv;charset=utf-8;' }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `relatorio-vendas-arena-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  function exportProductsReport() {
    const products = JSON.parse(localStorage.getItem('arena_products') || '[]');

    const rows: string[] = [];

    rows.push('RELATÓRIO DE PRODUTOS / ESTOQUE - ARENA JIU JITSU');
    rows.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
    rows.push('');
    rows.push('Produto;Código de Barras;Categoria;Preço;Estoque;Status');

    products
      .filter((p: any) => p.active)
      .forEach((p: any) => {
        rows.push([
          p.name || '',
          p.barcode || '',
          p.category || '',
          Number(p.price || 0).toFixed(2).replace('.', ','),
          p.stock || 0,
          Number(p.stock || 0) <= 5 ? 'Estoque baixo' : 'Ok',
        ].join(';'));
      });

    const csv = rows.join('\n');

    const blob = new Blob(
      ['\uFEFF' + csv],
      { type: 'text/csv;charset=utf-8;' }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `relatorio-produtos-arena-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="h-full flex flex-col overflow-auto">
      <div className="flex items-center gap-3 mb-6">
        <HardDrive className="w-7 h-7 text-accent" />
        <h1 className="text-2xl font-bold text-white">Backup / Exportar</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-6xl">
        <div className="dark-card p-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">
              Backup de segurança
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Use esta opção para salvar uma cópia completa dos dados do sistema.
              Esse arquivo é técnico e serve para segurança/restauração.
            </p>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <p className="text-yellow-400 font-semibold text-sm">
              ⚠️ Importante
            </p>
            <p className="text-gray-400 text-sm mt-1">
              O backup JSON não é para leitura. Ele serve para proteger os dados
              caso o computador seja formatado ou o navegador seja limpo.
            </p>
          </div>

          <button
            onClick={exportBackup}
            className="btn-accent w-full justify-center py-3 text-base"
          >
            <HardDrive className="w-5 h-5" />
            Baixar Backup de Segurança
          </button>

          <p className="text-xs text-gray-500">
            Guarde esse arquivo em um pendrive, Google Drive ou pasta segura.
          </p>
        </div>

        <div className="dark-card p-6 space-y-5">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">
              Relatórios legíveis
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Use estes botões quando quiser gerar arquivos fáceis de abrir no Excel,
              com informações claras sobre vendas e estoque.
            </p>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <p className="text-emerald-400 font-semibold text-sm">
              ✅ Ideal para a academia
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Esses relatórios mostram o que foi vendido, valores, clientes,
              forma de pagamento e quantidade de produtos.
            </p>
          </div>

          <button
            onClick={exportSalesReport}
            className="w-full justify-center py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-semibold flex items-center gap-2"
          >
            📊 Exportar Relatório de Vendas
          </button>

          <button
            onClick={exportProductsReport}
            className="w-full justify-center py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold flex items-center gap-2"
          >
            📦 Exportar Relatório de Produtos / Estoque
          </button>

          <p className="text-xs text-gray-500">
            Os arquivos serão baixados em CSV e podem ser abertos no Excel.
          </p>
        </div>

        <div className="dark-card p-6 space-y-5 lg:col-span-2">
          <h2 className="text-xl font-bold text-white">
            Como usar corretamente
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-dark-700 border border-dark-300 rounded-xl p-4">
              <p className="text-white font-semibold text-sm mb-2">
                1. Backup
              </p>
              <p className="text-gray-400 text-sm">
                Faça backup no final do dia ou antes de mexer no sistema.
              </p>
            </div>

            <div className="bg-dark-700 border border-dark-300 rounded-xl p-4">
              <p className="text-white font-semibold text-sm mb-2">
                2. Relatório de vendas
              </p>
              <p className="text-gray-400 text-sm">
                Use para ver o que foi vendido, para quem, quando e por quanto.
              </p>
            </div>

            <div className="bg-dark-700 border border-dark-300 rounded-xl p-4">
              <p className="text-white font-semibold text-sm mb-2">
                3. Relatório de estoque
              </p>
              <p className="text-gray-400 text-sm">
                Use para controlar produtos, preço e itens com estoque baixo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPlaceholder() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-7 h-7 text-accent" />
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
      </div>

      <div className="dark-card p-6 max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Nome do Estabelecimento
          </label>
          <input defaultValue="Arena Jiu Jitsu" className="dark-input" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            CNPJ
          </label>
          <input placeholder="00.000.000/0000-00" className="dark-input" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Versão
          </label>
          <p className="text-gray-500 text-sm">2.0.0</p>
        </div>
      </div>
    </div>
  );
}