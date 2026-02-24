import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Configuração centralizada do Axios
const api = axios.create({ baseURL: 'http://localhost:3000/api' });

function App() {
  const [activeTab, setActiveTab] = useState('materials');
  const [materials, setMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  const [suggestion, setSuggestion] = useState({ suggestion: [], total_revenue: 0 });

  // Estados para capturar dados dos formulários
  const [newMaterial, setNewMaterial] = useState({ name: '', stock_quantity: '' });
  const [newProduct, setNewProduct] = useState({ name: '', value: '' });

  // Carrega os dados sempre que mudar de aba
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const matRes = await api.get('/raw-materials');
      setMaterials(matRes.data);
      const prodRes = await api.get('/products');
      setProducts(prodRes.data);
      const sugRes = await api.get('/production-suggestion');
      setSuggestion(sugRes.data);
    } catch (err) {
      console.error("Erro ao buscar dados. O backend está ligado?", err);
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    try {
      await api.post('/raw-materials', newMaterial);
      alert("Material adicionado com sucesso!");
      setNewMaterial({ name: '', stock_quantity: '' });
      fetchData();
    } catch (err) {
      alert("Erro ao salvar material. Verifique o console.");
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products', newProduct); 
      alert("Produto cadastrado!");
      setNewProduct({ name: '', value: '' });
      fetchData();
    } catch (err) {
      alert("Erro ao salvar produto.");
    }
  };

  const handleAssociate = async (productId) => {
    const matId = document.getElementById(`mat-${productId}`).value;
    const qty = document.getElementById(`qty-${productId}`).value;
    
    if (!matId || !qty) return alert("Selecione o material e a quantidade necessária.");

    try {
      await api.post(`/products/${productId}/materials`, {
        material_id: parseInt(matId),
        quantity_needed: parseFloat(qty)
      });
      alert("Insumo vinculado ao produto!");
      fetchData();
    } catch (err) {
      alert("Erro ao vincular material.");
    }
  };

  // --- NOVAS FUNÇÕES DE EXCLUSÃO (CRUD COMPLETO) ---
  const handleDeleteMaterial = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este material?")) return;
    try {
      await api.delete(`/raw-materials/${id}`);
      alert("Material excluído com sucesso!");
      fetchData(); // Atualiza a lista na tela
    } catch (err) {
      alert("Erro ao excluir material. Verifique se o backend está rodando a nova rota.");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Tem certeza que deseja excluir este produto?")) return;
    try {
      await api.delete(`/products/${id}`);
      alert("Produto excluído com sucesso!");
      fetchData(); // Atualiza a lista na tela
    } catch (err) {
      alert("Erro ao excluir produto.");
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] text-white p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10 text-center border-b border-gray-800 pb-6">
          <h1 className="text-4xl font-black text-indigo-400 uppercase tracking-widest">Autoflex MRP</h1>
          <p className="text-gray-400 mt-2 font-medium">Controle de Produção e Matéria-Prima</p>
        </header>

        {/* Menu de Navegação */}
        <nav className="flex flex-wrap gap-4 mb-8 justify-center">
          <button 
            onClick={() => setActiveTab('materials')}
            className={`px-8 py-3 rounded-full font-bold transition-all shadow-lg ${activeTab === 'materials' ? 'bg-indigo-600 text-white scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            Materiais
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-8 py-3 rounded-full font-bold transition-all shadow-lg ${activeTab === 'products' ? 'bg-indigo-600 text-white scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            Produtos
          </button>
          <button 
            onClick={() => setActiveTab('production')}
            className={`px-8 py-3 rounded-full font-bold transition-all shadow-lg ${activeTab === 'production' ? 'bg-green-600 text-white scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            Sugestão de Produção
          </button>
        </nav>

        <main className="bg-gray-800 p-6 md:p-10 rounded-3xl shadow-2xl border border-gray-700">
          
          {/* ABA DE MATERIAIS */}
          {activeTab === 'materials' && (
            <section>
              <h2 className="text-2xl font-bold mb-6 text-indigo-300">Estoque de Matéria-Prima</h2>
              <form onSubmit={handleAddMaterial} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 bg-gray-900/50 p-6 rounded-2xl">
                <input 
                  className="bg-gray-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="Nome do Material (ex: Aço)" 
                  value={newMaterial.name}
                  onChange={(e) => setNewMaterial({...newMaterial, name: e.target.value})}
                  required
                />
                <input 
                  type="number"
                  className="bg-gray-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="Qtd em Estoque" 
                  value={newMaterial.stock_quantity}
                  onChange={(e) => setNewMaterial({...newMaterial, stock_quantity: e.target.value})}
                  required
                />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors shadow-md">
                  Adicionar Material
                </button>
              </form>

              <div className="overflow-hidden rounded-xl border border-gray-700">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-900/80 text-gray-400 uppercase text-xs tracking-widest">
                    <tr>
                      <th className="py-4 px-6">Nome do Insumo</th>
                      <th className="py-4 px-6 text-right">Quantidade Disponível</th>
                      <th className="py-4 px-6 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {materials.map(m => (
                      <tr key={m.id} className="hover:bg-gray-700/30 transition-colors">
                        <td className="py-4 px-6 font-semibold">{m.name}</td>
                        <td className="py-4 px-6 text-right font-mono text-indigo-400">{m.stock_quantity}</td>
                        <td className="py-4 px-6 text-center">
                          {/* Botão de Excluir Material */}
                          <button 
                            onClick={() => handleDeleteMaterial(m.id)}
                            className="bg-red-900/50 text-red-400 hover:bg-red-600 hover:text-white px-3 py-1 rounded-lg text-sm font-bold transition-all border border-red-800"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ABA DE PRODUTOS */}
          {activeTab === 'products' && (
            <section>
              <h2 className="text-2xl font-bold mb-6 text-indigo-300">Cadastro de Produtos finais</h2>
              <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 bg-gray-900/50 p-6 rounded-2xl">
                <input 
                  className="bg-gray-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nome do Produto" 
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  required
                />
                <input 
                  type="number"
                  className="bg-gray-700 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Preço de Venda (R$)" 
                  value={newProduct.value}
                  onChange={(e) => setNewProduct({...newProduct, value: e.target.value})}
                  required
                />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors shadow-md">
                  Salvar Produto
                </button>
              </form>

              <h3 className="text-lg font-bold mb-6 text-gray-400 border-l-4 border-indigo-500 pl-3">Composição do Produto (Vincular Materiais)</h3>
              <div className="grid gap-6">
                {products.map(p => (
                  <div key={p.id} className="bg-gray-900/30 p-6 rounded-2xl border border-gray-700 hover:border-indigo-500/50 transition-all shadow-inner">
                    <div className="flex justify-between items-center mb-6">
                      <span className="font-extrabold text-xl text-white">{p.name}</span>
                      <div className="flex gap-3 items-center">
                        <span className="bg-green-900/40 text-green-400 px-4 py-1 rounded-full font-mono text-sm border border-green-800">
                          R$ {p.value}
                        </span>
                        {/* Botão de Excluir Produto */}
                        <button 
                          onClick={() => handleDeleteProduct(p.id)}
                          className="bg-red-900/50 text-red-400 hover:bg-red-600 hover:text-white px-3 py-1 rounded-full text-sm font-bold transition-all border border-red-800"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-3">
                      <select id={`mat-${p.id}`} className="bg-gray-800 p-3 rounded-xl flex-1 text-sm outline-none border border-gray-700 focus:border-indigo-500">
                        <option value="">Selecione o Material...</option>
                        {materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                      <input id={`qty-${p.id}`} type="number" placeholder="Qtd" className="bg-gray-800 p-3 rounded-xl w-full md:w-24 outline-none border border-gray-700 focus:border-indigo-500" />
                      <button 
                        onClick={() => handleAssociate(p.id)}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-3 rounded-xl font-bold transition-all active:scale-95"
                      >
                        Vincular
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ABA DE SUGESTÃO (MRP LOGIC) */}
          {activeTab === 'production' && (
            <section>
              <div className="flex flex-col md:flex-row justify-between items-center mb-10 bg-indigo-900/20 p-6 rounded-2xl border border-indigo-500/30">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-2xl font-bold text-indigo-300">Plano de Produção Inteligente</h2>
                  <p className="text-gray-400 text-sm">Otimizado para máximo faturamento</p>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Faturamento Total Estimado</p>
                  <p className="text-4xl font-black text-green-400 shadow-green-500/20 drop-shadow-lg">
                    R$ {suggestion.total_revenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                {suggestion.suggestion?.map((item, idx) => (
                  <div key={idx} className="bg-gray-900/50 p-6 rounded-2xl border-l-8 border-green-500 flex justify-between items-center shadow-lg hover:translate-x-1 transition-transform">
                    <div>
                      <h3 className="font-black text-xl text-white">{item.name}</h3>
                      <p className="text-indigo-400 font-bold mt-1">Sugerido: {item.quantity} unidades</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase mb-1">Subtotal</p>
                      <p className="font-mono text-xl text-green-300">R$ {item.total_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                ))}
                {suggestion.suggestion?.length === 0 && (
                  <div className="text-center py-20 bg-gray-900/20 rounded-2xl border-2 border-dashed border-gray-700">
                    <p className="text-gray-500 italic">Sem insumos suficientes para produção. Abasteça o estoque ou vincule materiais aos produtos.</p>
                  </div>
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;