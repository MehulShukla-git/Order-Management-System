import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, X, AlertCircle } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/orders');
      if (res.data.success) {
        setOrders(res.data.data);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? Stock will be restored.')) return;
    try {
      const res = await axios.put(`http://localhost:5000/api/orders/${orderId}`, { order_status: 'Cancelled' });
      if (res.data.success) {
        alert('Order cancelled successfully.');
        fetchOrders();
      } else {
        alert('Error: ' + res.data.message);
      }
    } catch (err) {
      alert('Error cancelling order: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.order_number.toLowerCase().includes(search.toLowerCase()) || 
                          (o.customer_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || o.order_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500">Manage customer orders and view details.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          <Plus size={20} />
          <span>Create Order</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by order number or customer..." 
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="border rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading orders...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 flex justify-center items-center gap-2">
            <AlertCircle /> {error}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider border-b">
                  <th className="p-4 font-medium">Order Number</th>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Total</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{order.order_number}</td>
                    <td className="p-4 text-gray-600">{order.customer_name || 'Unknown'}</td>
                    <td className="p-4 text-gray-500">{new Date(order.order_date).toLocaleDateString()}</td>
                    <td className="p-4 font-medium">${order.total_amount.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        order.order_status === 'Delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                        order.order_status === 'Confirmed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        order.order_status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        {order.order_status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {order.order_status !== 'Cancelled' && (
                        <button 
                          onClick={() => handleCancelOrder(order.id)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm"
                        >
                          Cancel
                        </button>
                      )}
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
