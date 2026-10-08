import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, ShoppingCart, DollarSign, Users, AlertTriangle } from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

const Dashboard = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/analytics/overview')
      .then(res => setData(res.data.data))
      .catch(console.error);
  }, []);

  if (!data) return <div className="p-6">Loading dashboard data...</div>;

  const kpis = [
    { title: 'Total Revenue', value: `$${Number(data.totalRevenue || 0).toFixed(2)}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Total Orders', value: data.totalOrders, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Total Products', value: data.totalProducts, icon: Package, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Total Customers', value: data.totalCustomers, icon: Users, color: 'text-orange-600', bg: 'bg-orange-100' },
    { title: 'Low Stock Items', value: data.lowStock, icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { title: 'Out of Stock', value: data.outOfStock, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
    { title: 'Avg Order Value', value: `$${Number(data.averageOrderValue || 0).toFixed(2)}`, icon: DollarSign, color: 'text-teal-600', bg: 'bg-teal-100' },
    { title: 'Units Sold', value: data.unitsSold, icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  ];

  const salesOverTime = (data.salesOverTime || []).map((entry) => ({
    month: entry.name,
    sales: Number(entry.sales || 0)
  }));

  const inventoryStatusData = [
    { name: 'In Stock', value: Math.max(0, Number(data.inStock || 0)) },
    { name: 'Low Stock', value: Number(data.lowStock || 0) },
    { name: 'Out of Stock', value: Number(data.outOfStock || 0) },
  ].filter(d => d.value > 0);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map(kpi => (
          <div key={kpi.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className={`p-4 rounded-full ${kpi.bg} ${kpi.color}`}>
              <kpi.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
              <h3 className="text-2xl font-bold text-gray-900">{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold">Revenue Trend</h2>
          <p className="mb-4 text-sm text-gray-500">Revenue performance over time</p>
          {salesOverTime.length === 0 ? (
            <p className="flex h-64 items-center justify-center text-sm text-gray-500">No sales data available for this period.</p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesOverTime}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={v => [`$${v}`, 'Revenue']} />
                  <Area type="monotone" dataKey="sales" stroke="#3b82f6" fill="#bfdbfe" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold mb-4">Inventory Status</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {inventoryStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
