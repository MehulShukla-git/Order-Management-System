import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, AlertTriangle, AlertCircle, PackageCheck } from 'lucide-react';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:5000/api/products');
        if (res.data.success) {
          setProducts(res.data.data);
        } else {
          setError(res.data.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.product_name.toLowerCase().includes(search.toLowerCase()) || 
                          p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.stock_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const lowStockCount = products.filter(p => p.stock_status === 'LOW STOCK').length;
  const outOfStockCount = products.filter(p => p.stock_status === 'OUT OF STOCK').length;
  const inStockCount = products.filter(p => p.stock_status === 'IN STOCK').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-500">Monitor stock levels and statuses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
            <PackageCheck size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">In Stock</p>
            <p className="text-2xl font-bold text-gray-900">{inStockCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Low Stock</p>
            <p className="text-2xl font-bold text-gray-900">{lowStockCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Out of Stock</p>
            <p className="text-2xl font-bold text-gray-900">{outOfStockCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search products or SKU..." 
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="border rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="IN STOCK">In Stock</option>
            <option value="LOW STOCK">Low Stock</option>
            <option value="OUT OF STOCK">Out of Stock</option>
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading inventory...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider border-b">
                  <th className="p-4 font-medium">Product & SKU</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium text-right">Current Stock</th>
                  <th className="p-4 font-medium text-right">Threshold</th>
                  <th className="p-4 font-medium text-right">Total Sold</th>
                  <th className="p-4 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{p.product_name}</div>
                      <div className="text-gray-500 text-xs">{p.sku}</div>
                    </td>
                    <td className="p-4 text-gray-600">{p.category}</td>
                    <td className="p-4 text-right font-bold text-gray-900">{p.current_stock}</td>
                    <td className="p-4 text-right text-gray-500">{p.low_stock_threshold}</td>
                    <td className="p-4 text-right font-medium text-gray-600">{p.total_sold}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        p.stock_status === 'IN STOCK' ? 'bg-green-50 text-green-700 border-green-200' :
                        p.stock_status === 'LOW STOCK' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {p.stock_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
