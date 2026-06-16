import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getActiveProducts,
  getProductByBarcode,
  searchMembers,
  insertSale,
  insertSaleItems,
  updateProduct,
} from '../lib/db';
import {
  Product,
  Member,
  CartItem,
  PaymentMethod,
  PAYMENT_METHODS,
  SaleStatus,
  formatCurrency,
  formatCPF,
} from '../lib/types';
import {
  ScanBarcode,
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  User,
  Search,
  X,
  Receipt,
  Check,
  AlertCircle,
  Clock,
} from 'lucide-react';

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcode, setBarcode] = useState('');
  const [member, setMember] = useState<Member | null>(null);
  const [isFinalConsumer, setIsFinalConsumer] = useState(false);
  const [memberQuery, setMemberQuery] = useState('');
  const [memberResults, setMemberResults] = useState<Member[]>([]);
  const [showMemberSearch, setShowMemberSearch] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [saleStatus, setSaleStatus] = useState<SaleStatus>('pago');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSaleId, setLastSaleId] = useState('');
  const [lastSaleStatus, setLastSaleStatus] = useState<SaleStatus>('pago');
  const [notFound, setNotFound] = useState(false);
  const barcodeRef = useRef<HTMLInputElement>(null);

  const reloadProducts = useCallback(() => {
    setProducts(getActiveProducts());
  }, []);

  useEffect(() => {
    reloadProducts();
  }, [reloadProducts]);

  useEffect(() => {
    barcodeRef.current?.focus();
  }, []);

  function addToCart(product: Product) {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);

      if (existing) {
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }

      return [...prev, { product, quantity: 1 }];
    });

    setNotFound(false);
  }

  function handleBarcodeEnter() {
    const code = barcode.trim();

    if (!code) return;

    const product = getProductByBarcode(code);

    if (product) {
      addToCart(product);
      setBarcode('');
    } else {
      setNotFound(true);
      setTimeout(() => setNotFound(false), 2000);
      setBarcode('');
    }

    barcodeRef.current?.focus();
  }

  function updateQty(productId: string, delta: number) {
    setCart(prev =>
      prev
        .map(i =>
          i.product.id === productId
            ? { ...i, quantity: i.quantity + delta }
            : i
        )
        .filter(i => i.quantity > 0)
    );
  }

  const total = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);

  function handleMemberSearch(q: string) {
    setMemberQuery(q);

    if (q.length >= 2) {
      setMemberResults(searchMembers(q));
    } else {
      setMemberResults([]);
    }
  }

  function selectMember(m: Member) {
    setMember(m);
    setIsFinalConsumer(false);
    setShowMemberSearch(false);
    setMemberQuery('');
    setMemberResults([]);

    setTimeout(() => barcodeRef.current?.focus(), 50);
  }

  function selectFinalConsumer() {
    setMember(null);
    setIsFinalConsumer(true);
    setSaleStatus('pago');
    setShowMemberSearch(false);
    setMemberQuery('');
    setMemberResults([]);

    setTimeout(() => barcodeRef.current?.focus(), 50);
  }

  function clearBuyer() {
    setMember(null);
    setIsFinalConsumer(false);
    setSaleStatus('pago');
  }

  function openCheckout() {
    if (cart.length === 0) return;

    if (!member && !isFinalConsumer) {
      alert('Selecione quem está comprando ou marque como Consumidor Final.');
      return;
    }

    setSaleStatus('pago');
    setShowCheckout(true);
  }

  function completeSale() {
    if (cart.length === 0) return;

    if (!member && !isFinalConsumer) {
      alert('Selecione quem está realizando a compra.');
      return;
    }

    if (saleStatus === 'pendente' && !member) {
      alert('Para usar "Acertar Outra Hora", selecione um cliente cadastrado.');
      return;
    }

    const sale = insertSale({
      member_id: member?.id ?? null,
      total,
      payment_method: paymentMethod,
      status: saleStatus,
    });

    insertSaleItems(
      cart.map(i => ({
        sale_id: sale.id,
        product_id: i.product.id,
        product_name: i.product.name,
        quantity: i.quantity,
        unit_price: i.product.price,
        total_price: i.product.price * i.quantity,
      }))
    );

    for (const i of cart) {
      updateProduct(i.product.id, {
        stock: i.product.stock - i.quantity,
      });
    }

    setLastSaleId(sale.id);
    setLastSaleStatus(saleStatus);
    setCart([]);
    setMember(null);
    setIsFinalConsumer(false);
    setSaleStatus('pago');
    setShowCheckout(false);
    setShowReceipt(true);
    reloadProducts();
  }

  const payPalette: Record<PaymentMethod, string> = {
    dinheiro: 'border-emerald-500 bg-emerald-500/10 text-emerald-400',
    cartão: 'border-orange-500 bg-orange-500/10 text-orange-400',
    pix: 'border-blue-500 bg-blue-500/10 text-blue-400',
  };

  return (
    <div className="h-full flex gap-5">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 mb-4">
          <ScanBarcode className="w-7 h-7 text-accent" />
          <h1 className="text-2xl font-bold text-white">Nova Venda</h1>
        </div>

        <div className="dark-card p-4 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Quem está comprando?
          </p>

          {member ? (
            <div className="flex items-center justify-between bg-dark-700 border border-accent/40 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-accent" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    Cliente selecionado: {member.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Matrícula: {member.registration_number}
                    {member.phone ? ` · Telefone: ${member.phone}` : ''}
                  </p>
                </div>
              </div>

              <button
                onClick={clearBuyer}
                className="p-1.5 rounded-md hover:bg-dark-400 text-gray-500 hover:text-white transition-colors"
                title="Remover cliente"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : isFinalConsumer ? (
            <div className="flex items-center justify-between bg-dark-700 border border-emerald-500/40 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-emerald-400" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    Consumidor Final
                  </p>
                  <p className="text-xs text-gray-500">
                    Venda sem vínculo com aluno cadastrado.
                  </p>
                </div>
              </div>

              <button
                onClick={clearBuyer}
                className="p-1.5 rounded-md hover:bg-dark-400 text-gray-500 hover:text-white transition-colors"
                title="Remover consumidor final"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowMemberSearch(true)}
                className="bg-dark-700 border border-dark-300 hover:border-accent/50 rounded-xl p-4 text-left transition-all"
              >
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <User className="w-4 h-4 text-accent" />
                  Buscar aluno/cliente
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Use para saber quem comprou.
                </p>
              </button>

              <button
                onClick={selectFinalConsumer}
                className="bg-dark-700 border border-dark-300 hover:border-emerald-500/50 rounded-xl p-4 text-left transition-all"
              >
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <User className="w-4 h-4 text-emerald-400" />
                  Consumidor Final
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Venda rápida sem cadastro.
                </p>
              </button>
            </div>
          )}
        </div>

        <div className="relative mb-4">
          <ScanBarcode
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
              notFound ? 'text-red-500' : 'text-accent'
            }`}
          />

          <input
            ref={barcodeRef}
            type="text"
            value={barcode}
            onChange={e => setBarcode(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleBarcodeEnter();
            }}
            placeholder="Escaneie o código de barras ou digite e pressione Enter..."
            className={`w-full rounded-xl px-4 py-3 pl-11 text-base font-mono focus:outline-none focus:ring-2 transition-all border-2 bg-dark-700 text-white placeholder-gray-600 ${
              notFound
                ? 'border-red-500 focus:ring-red-500'
                : 'border-dark-300 focus:border-accent focus:ring-accent/30'
            }`}
            autoFocus
          />

          {notFound && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              Não encontrado
            </div>
          )}
        </div>

        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Atalhos rápidos
          </p>

          <div className="flex flex-wrap gap-2">
            {products.map(p => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="bg-dark-600 border border-dark-300 hover:border-accent/50 hover:bg-dark-500 rounded-lg px-3 py-1.5 text-xs text-gray-300 hover:text-white transition-all active:scale-95"
              >
                {p.name}
                <span className="text-accent font-semibold ml-1">
                  {formatCurrency(p.price)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-[400px] flex flex-col dark-card">
        <div className="p-4 border-b border-dark-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-accent" />
            <span className="font-bold text-white">Carrinho</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="badge-pill bg-dark-300 text-gray-300">
              {cart.length} {cart.length === 1 ? 'item' : 'itens'}
            </span>

            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        <div className="p-3 border-b border-dark-300">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Comprador
          </p>

          <p className="text-sm text-white">
            {member
              ? member.name
              : isFinalConsumer
              ? 'Consumidor Final'
              : 'Nenhum comprador selecionado'}
          </p>
        </div>

        <div className="flex-1 overflow-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-600">
              <ShoppingCart className="w-14 h-14 mb-3 opacity-30" />
              <p className="text-sm">Carrinho vazio</p>
              <p className="text-xs mt-1">Escaneie um produto para começar</p>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.product.id}
                className="flex items-center gap-2 bg-dark-700 rounded-lg p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(item.product.price)} un.
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQty(item.product.id, -1)}
                    className="w-7 h-7 rounded-md bg-dark-500 border border-dark-300 flex items-center justify-center hover:bg-dark-400 text-gray-400 hover:text-white transition-all active:scale-90"
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  <span className="w-7 text-center font-bold text-white text-sm">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => updateQty(item.product.id, 1)}
                    className="w-7 h-7 rounded-md bg-dark-500 border border-dark-300 flex items-center justify-center hover:bg-dark-400 text-gray-400 hover:text-white transition-all active:scale-90"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <p className="font-bold text-white text-sm w-16 text-right">
                  {formatCurrency(item.product.price * item.quantity)}
                </p>

                <button
                  onClick={() =>
                    setCart(prev =>
                      prev.filter(i => i.product.id !== item.product.id)
                    )
                  }
                  className="p-1 rounded-md hover:bg-red-900/40 text-gray-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-dark-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 font-medium">Total</span>
            <span className="text-3xl font-bold text-white">
              {formatCurrency(total)}
            </span>
          </div>

          <button
            onClick={openCheckout}
            disabled={cart.length === 0}
            className="btn-accent w-full justify-center py-3 text-base shadow-glow-red disabled:shadow-none"
          >
            <Receipt className="w-5 h-5" />
            Finalizar Venda
          </button>
        </div>
      </div>

      {showMemberSearch && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setShowMemberSearch(false)}
        >
          <div
            className="bg-dark-600 border border-dark-300 rounded-xl p-6 w-full max-w-md shadow-dark-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">
                Buscar Cliente
              </h2>

              <button
                onClick={() => setShowMemberSearch(false)}
                className="p-1.5 rounded-md hover:bg-dark-400 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />

              <input
                type="text"
                value={memberQuery}
                onChange={e => handleMemberSearch(e.target.value)}
                placeholder="Nome, CPF ou matrícula..."
                className="dark-input pl-9"
                autoFocus
              />
            </div>

            <div className="max-h-64 overflow-auto space-y-1.5">
              {memberResults.map(m => (
                <button
                  key={m.id}
                  onClick={() => selectMember(m)}
                  className="w-full text-left p-3 rounded-lg bg-dark-700 hover:bg-dark-500 border border-dark-300 hover:border-accent/40 transition-all"
                >
                  <p className="font-medium text-white">{m.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Mat. {m.registration_number} · CPF: {formatCPF(m.cpf)}
                  </p>
                </button>
              ))}

              {memberQuery.length >= 2 && memberResults.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  Nenhum cliente encontrado
                </p>
              )}

              <button
                onClick={selectFinalConsumer}
                className="w-full text-left p-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all"
              >
                <p className="font-medium text-emerald-400">
                  Usar Consumidor Final
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Para venda sem cliente cadastrado.
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {showCheckout && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setShowCheckout(false)}
        >
          <div
            className="bg-dark-600 border border-dark-300 rounded-xl p-6 w-full max-w-md shadow-dark-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">
                Finalizar Venda
              </h2>

              <button
                onClick={() => setShowCheckout(false)}
                className="p-1.5 rounded-md hover:bg-dark-400 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-dark-700 rounded-lg border border-dark-300">
              <p className="text-sm text-gray-300">
                <span className="font-medium text-white">Comprador:</span>{' '}
                {member ? member.name : 'Consumidor Final'}
              </p>

              {member && (
                <p className="text-xs text-gray-500">
                  Matrícula {member.registration_number}
                </p>
              )}
            </div>

            <p className="text-sm text-gray-400 mb-2">Forma de pagamento</p>

            <div className="grid grid-cols-3 gap-2 mb-5">
              {PAYMENT_METHODS.map(pm => (
                <button
                  key={pm.value}
                  onClick={() => setPaymentMethod(pm.value)}
                  className={`py-3 rounded-xl font-semibold text-sm border-2 transition-all ${
                    paymentMethod === pm.value
                      ? payPalette[pm.value]
                      : 'border-dark-300 bg-dark-700 text-gray-400 hover:border-dark-200'
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>

            <div className="mb-5">
              <p className="text-sm text-gray-400 mb-2">Situação da venda</p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSaleStatus('pago')}
                  className={`rounded-xl p-3 border-2 font-semibold text-sm transition-all ${
                    saleStatus === 'pago'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-dark-300 bg-dark-700 text-gray-400 hover:border-dark-200'
                  }`}
                >
                  <Check className="w-4 h-4 inline mr-1" />
                  Pago agora
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!member) {
                      alert('Para acertar outra hora, selecione um cliente cadastrado.');
                      return;
                    }

                    setSaleStatus('pendente');
                  }}
                  className={`rounded-xl p-3 border-2 font-semibold text-sm transition-all ${
                    saleStatus === 'pendente'
                      ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                      : 'border-dark-300 bg-dark-700 text-gray-400 hover:border-dark-200'
                  }`}
                >
                  <Clock className="w-4 h-4 inline mr-1" />
                  Acertar outra hora
                </button>
              </div>

              {saleStatus === 'pendente' && (
                <p className="text-xs text-yellow-400 mt-2">
                  Esta venda ficará como pendente no cadastro do cliente.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between mb-5 p-3 bg-dark-700 rounded-lg">
              <span className="text-gray-400">Total</span>
              <span className="text-2xl font-bold text-white">
                {formatCurrency(total)}
              </span>
            </div>

            <button
              onClick={completeSale}
              className="btn-accent w-full justify-center py-3 text-base shadow-glow-red"
            >
              <Check className="w-5 h-5" />
              {saleStatus === 'pendente'
                ? 'Salvar Pendência'
                : 'Confirmar Pagamento'}
            </button>
          </div>
        </div>
      )}

      {showReceipt && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-dark-600 border border-dark-300 rounded-xl p-8 w-full max-w-sm shadow-dark-lg text-center">
            <div
              className={`w-20 h-20 rounded-full border-2 flex items-center justify-center mx-auto mb-5 ${
                lastSaleStatus === 'pendente'
                  ? 'bg-yellow-500/20 border-yellow-500'
                  : 'bg-emerald-500/20 border-emerald-500'
              }`}
            >
              {lastSaleStatus === 'pendente' ? (
                <Clock className="w-10 h-10 text-yellow-400" />
              ) : (
                <Check className="w-10 h-10 text-emerald-400" />
              )}
            </div>

            <h2 className="text-xl font-bold text-white mb-1">
              {lastSaleStatus === 'pendente'
                ? 'Pendência Registrada!'
                : 'Venda Concluída!'}
            </h2>

            <p className="text-gray-500 text-sm mb-6">
              #{lastSaleId.slice(0, 8).toUpperCase()}
            </p>

            <button
              onClick={() => {
                setShowReceipt(false);
                setTimeout(() => barcodeRef.current?.focus(), 50);
              }}
              className="btn-accent w-full justify-center py-3"
            >
              <ShoppingCart className="w-5 h-5" />
              Nova Venda
            </button>
          </div>
        </div>
      )}
    </div>
  );
}