import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, CheckCircle, AlertTriangle, XCircle, RefreshCw, Package, ShoppingCart, Users, BarChart2 } from 'lucide-react';

export default function DataQuality() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('http://localhost:5000/api/analytics/overview');
      if (res.data.success) {
        setOverview(res.data.data);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading data quality report...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  const tables = [
    {
      name: 'Products',
      icon: Package,
      count: overview.totalProducts,
      color: 'bg-blue-100 text-blue-600',
      checks: [
        { label: 'Total products in catalog', status: overview.totalProducts > 0 ? 'pass' : 'fail', detail: `${overview.totalProducts} records` },
        { label: 'Low stock items detected', status: overview.lowStock > 0 ? 'warn' : 'pass', detail: `${overview.lowStock} items` },
        { label: 'Out of stock items', status: overview.outOfStock > 0 ? 'warn' : 'pass', detail: `${overview.outOfStock} items` },
        { label: 'Products with sales data', status: overview.unitsSold > 0 ? 'pass' : 'warn', detail: `${overview.unitsSold} units sold total` },
      ]
    },
    {
      name: 'Orders',
      icon: ShoppingCart,
      count: overview.totalOrders,
      color: 'bg-green-100 text-green-600',
      checks: [
        { label: 'Total orders in system', status: overview.totalOrders > 0 ? 'pass' : 'warn', detail: `${overview.totalOrders} orders` },
        { label: 'Revenue generated', status: overview.totalRevenue > 0 ? 'pass' : 'warn', detail: `$${overview.totalRevenue?.toFixed(2) ?? '0.00'}` },
        { label: 'Average order value', status: overview.averageOrderValue > 0 ? 'pass' : 'warn', detail: `$${overview.averageOrderValue?.toFixed(2) ?? '0.00'}` },
      ]
    },
    {
      name: 'Customers',
      icon: Users,
      count: overview.totalCustomers,
      color: 'bg-purple-100 text-purple-600',
      checks: [
        { label: 'Total customers registered', status: overview.totalCustomers > 0 ? 'pass' : 'warn', detail: `${overview.totalCustomers} customers` },
        { label: 'Customer purchase activity', status: overview.totalOrders > 0 ? 'pass' : 'warn', detail: overview.totalOrders > 0 ? 'Active' : 'No orders' },
      ]
    },
  ];

  const StatusIcon = ({ status }) => {
    if (status === 'pass') return <CheckCircle size={16} className="text-green-500" />;
    if (status === 'warn') return <AlertTriangle size={16} className="text-yellow-500" />;
    return <XCircle size={16} className="text-red-500" />;
  };

  const allChecks = tables.flatMap(t => t.checks);
  const passCount = allChecks.filter(c => c.status === 'pass').length;
  const warnCount = allChecks.filter(c => c.status === 'warn').length;
  const failCount = allChecks.filter(c => c.status === 'fail').length;
  const score = Math.round((passCount / allChecks.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Quality</h1>
          <p className="text-gray-500">Database health checks and completeness report.</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Health Score */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Overall Data Health Score</h2>
            <p className="text-sm text-gray-500">Based on {allChecks.length} automated checks</p>
          </div>
          <div className={`text-5xl font-extrabold ${score >= 80 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
            {score}%
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${score}%` }}
          />
        </div>
        <div className="flex gap-6 mt-4 text-sm">
          <span className="flex items-center gap-1.5 text-green-600"><CheckCircle size={14} /> {passCount} Passed</span>
          <span className="flex items-center gap-1.5 text-yellow-600"><AlertTriangle size={14} /> {warnCount} Warnings</span>
          <span className="flex items-center gap-1.5 text-red-600"><XCircle size={14} /> {failCount} Failed</span>
        </div>
      </div>

      {/* Summary Counts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tables.map(table => {
          const TableIcon = table.icon;
          return (
            <div key={table.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${table.color}`}>
                <TableIcon size={22} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{table.name}</p>
                <p className="text-3xl font-bold text-gray-900">{table.count}</p>
                <p className="text-xs text-gray-400">total records</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Per-Table Checks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tables.map(table => {
          const TableIcon = table.icon;
          return (
            <div key={table.name} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${table.color}`}>
                  <TableIcon size={16} />
                </div>
                <h3 className="font-bold text-gray-900">{table.name} Table Checks</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {table.checks.map((check, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <StatusIcon status={check.status} />
                      <span className="text-sm text-gray-700">{check.label}</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      check.status === 'pass' ? 'bg-green-50 text-green-600' :
                      check.status === 'warn' ? 'bg-yellow-50 text-yellow-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {check.detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* DB Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 text-gray-600">
              <Database size={16} />
            </div>
            <h3 className="font-bold text-gray-900">Database Information</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {[
              { label: 'Database Engine', value: 'SQLite (better-sqlite3)' },
              { label: 'Database File', value: 'smartstock.db' },
              { label: 'Tables', value: 'products, orders, order_items, customers, inventory_transactions' },
              { label: 'Architecture', value: 'Single-branch' },
              { label: 'Backend', value: 'Express.js (Node.js)' },
              { label: 'ML Model', value: 'Random Forest Regressor' },
            ].map((row, idx) => (
              <div key={idx} className="flex items-start justify-between p-4 gap-4">
                <span className="text-sm text-gray-500 shrink-0">{row.label}</span>
                <span className="text-sm font-medium text-gray-800 text-right">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
