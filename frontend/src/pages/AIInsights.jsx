import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Brain, TrendingUp, AlertTriangle, RefreshCw, CheckCircle, Activity } from 'lucide-react';

const RISK_COLORS = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#10b981' };
const RISK_BG = {
  HIGH: 'bg-red-50 text-red-700 border-red-200',
  MEDIUM: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  LOW: 'bg-green-50 text-green-700 border-green-200'
};

export default function AIInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('http://localhost:5000/api/ai/insights');
      if (res.data.success) {
        setData(res.data.data);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const MetricCard = ({ label, value, icon: Icon, color }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Running demand forecast model...</p>
        <p className="text-gray-400 text-xs">This may take a few seconds</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
          <p className="text-gray-500">ML-powered demand forecasting and restock recommendations.</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center gap-3">
          <AlertTriangle size={40} className="text-red-500" />
          <h3 className="font-semibold text-red-700 text-lg">Prediction Model Error</h3>
          <p className="text-red-600 text-sm text-center max-w-md">{error}</p>
          <p className="text-gray-500 text-xs text-center">
            Make sure Python is installed and the ML model has been trained.
            Run <code className="bg-gray-100 px-1 rounded">python ml/train.py</code> first.
          </p>
          <button
            onClick={fetchInsights}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition mt-2"
          >
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const { metrics, insights } = data;
  const highRisk = insights.filter(i => i.risk === 'HIGH').length;
  const mediumRisk = insights.filter(i => i.risk === 'MEDIUM').length;
  const lowRisk = insights.filter(i => i.risk === 'LOW').length;

  const chartData = insights.slice(0, 10).map(i => ({
    name: i.product_name.length > 16 ? i.product_name.substring(0, 14) + '…' : i.product_name,
    restock: i.restock_quantity,
    demand: i.predicted_demand,
    risk: i.risk
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
          <p className="text-gray-500">ML-powered demand forecasting and restock recommendations.</p>
        </div>
        <button
          onClick={fetchInsights}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
        >
          <RefreshCw size={16} /> Refresh Predictions
        </button>
      </div>

      {/* Model Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Activity size={18} className="text-blue-600" /> Model Performance Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard label="Mean Absolute Error (MAE)" value={metrics.MAE?.toFixed(3) ?? 'N/A'} icon={TrendingUp} color="bg-blue-100 text-blue-600" />
          <MetricCard label="Root Mean Sq. Error (RMSE)" value={metrics.RMSE?.toFixed(3) ?? 'N/A'} icon={Activity} color="bg-purple-100 text-purple-600" />
          <MetricCard label="R² Score" value={metrics.R2?.toFixed(4) ?? 'N/A'} icon={CheckCircle} color="bg-green-100 text-green-600" />
        </div>
      </div>

      {/* Risk Summary */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Brain size={18} className="text-purple-600" /> Restock Risk Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-red-50 border border-red-100 rounded-xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle size={22} />
            </div>
            <div>
              <p className="text-sm font-medium text-red-600">High Risk</p>
              <p className="text-3xl font-bold text-red-700">{highRisk}</p>
              <p className="text-xs text-red-500">Out of stock now</p>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
              <AlertTriangle size={22} />
            </div>
            <div>
              <p className="text-sm font-medium text-yellow-600">Medium Risk</p>
              <p className="text-3xl font-bold text-yellow-700">{mediumRisk}</p>
              <p className="text-xs text-yellow-500">Needs restocking soon</p>
            </div>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <CheckCircle size={22} />
            </div>
            <div>
              <p className="text-sm font-medium text-green-600">Low Risk</p>
              <p className="text-3xl font-bold text-green-700">{lowRisk}</p>
              <p className="text-xs text-green-500">Stock is sufficient</p>
            </div>
          </div>
        </div>
      </div>

      {/* Restock Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Top 10 — Recommended Restock Quantities</h3>
        <p className="text-sm text-gray-500 mb-4">Products with highest restock need, colored by risk level.</p>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} angle={-30} textAnchor="end" tick={{ fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip formatter={(value, name) => [value, name === 'restock' ? 'Restock Qty' : 'Predicted Demand']} />
              <Bar dataKey="restock" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.risk]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Full Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Detailed Restock Recommendations</h3>
          <p className="text-sm text-gray-500">All products sorted by restock urgency.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b">
                <th className="p-4 font-medium">Product</th>
                <th className="p-4 font-medium text-right">Current Stock</th>
                <th className="p-4 font-medium text-right">Predicted Demand</th>
                <th className="p-4 font-medium text-right">Recommended Stock</th>
                <th className="p-4 font-medium text-right">Restock Qty</th>
                <th className="p-4 font-medium text-center">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {insights.map(item => (
                <tr key={item.product_id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-900">{item.product_name}</td>
                  <td className="p-4 text-right text-gray-700">{item.current_stock}</td>
                  <td className="p-4 text-right text-blue-600 font-medium">{item.predicted_demand}</td>
                  <td className="p-4 text-right text-gray-700">{item.recommended_stock}</td>
                  <td className="p-4 text-right font-bold text-gray-900">{item.restock_quantity}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${RISK_BG[item.risk]}`}>
                      {item.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
