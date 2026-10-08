import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Bell, Package, Building2, Palette } from 'lucide-react';

const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="p-4 border-b border-gray-100 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
        <Icon size={16} />
      </div>
      <h3 className="font-bold text-gray-900">{title}</h3>
    </div>
    <div className="p-6 space-y-4">{children}</div>
  </div>
);

const Field = ({ label, description, children }) => (
  <div className="flex items-start justify-between gap-6">
    <div className="flex-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const Toggle = ({ value, onChange }) => (
  <button
    onClick={() => onChange(!value)}
    className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${value ? 'bg-blue-600' : 'bg-gray-200'}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

export default function Settings() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    storeName: 'SmartStock',
    storeCity: 'New York',
    currency: 'USD',
    lowStockThreshold: 10,
    autoReorderEnabled: false,
    emailNotifications: true,
    lowStockAlerts: true,
    orderAlerts: true,
    theme: 'light',
    language: 'en',
    timezone: 'America/New_York',
  });

  const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500">Configure your SmartStock system preferences.</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition ${saved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          <Save size={16} /> {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm flex items-center gap-2">
          ✓ Settings saved successfully.
        </div>
      )}

      <Section title="General" icon={Building2}>
        <Field label="Store Name" description="The name shown in the sidebar and reports.">
          <input
            type="text"
            value={settings.storeName}
            onChange={e => update('storeName', e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm w-44 focus:outline-none focus:border-blue-500"
          />
        </Field>
        <Field label="City / Branch" description="Single-branch location identifier.">
          <input
            type="text"
            value={settings.storeCity}
            onChange={e => update('storeCity', e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm w-44 focus:outline-none focus:border-blue-500"
          />
        </Field>
        <Field label="Currency" description="Currency used for all monetary values.">
          <select
            value={settings.currency}
            onChange={e => update('currency', e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm w-28 focus:outline-none focus:border-blue-500"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="INR">INR (₹)</option>
          </select>
        </Field>
        <Field label="Timezone" description="Timezone for timestamps and scheduling.">
          <select
            value={settings.timezone}
            onChange={e => update('timezone', e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm w-52 focus:outline-none focus:border-blue-500"
          >
            <option value="America/New_York">America/New_York</option>
            <option value="America/Los_Angeles">America/Los_Angeles</option>
            <option value="Europe/London">Europe/London</option>
            <option value="Asia/Kolkata">Asia/Kolkata</option>
            <option value="Asia/Tokyo">Asia/Tokyo</option>
          </select>
        </Field>
      </Section>

      <Section title="Inventory" icon={Package}>
        <Field label="Default Low Stock Threshold" description="Alert when stock falls below this number.">
          <input
            type="number"
            value={settings.lowStockThreshold}
            min={1}
            max={100}
            onChange={e => update('lowStockThreshold', parseInt(e.target.value) || 10)}
            className="border rounded-lg px-3 py-1.5 text-sm w-20 focus:outline-none focus:border-blue-500"
          />
        </Field>
        <Field label="Auto-Reorder" description="Automatically flag restock when ML model predicts stockout.">
          <Toggle value={settings.autoReorderEnabled} onChange={v => update('autoReorderEnabled', v)} />
        </Field>
      </Section>

      <Section title="Notifications" icon={Bell}>
        <Field label="Email Notifications" description="Receive email alerts for system events.">
          <Toggle value={settings.emailNotifications} onChange={v => update('emailNotifications', v)} />
        </Field>
        <Field label="Low Stock Alerts" description="Get notified when products reach low stock threshold.">
          <Toggle value={settings.lowStockAlerts} onChange={v => update('lowStockAlerts', v)} />
        </Field>
        <Field label="New Order Alerts" description="Get notified when new orders are placed.">
          <Toggle value={settings.orderAlerts} onChange={v => update('orderAlerts', v)} />
        </Field>
      </Section>

      <Section title="Appearance" icon={Palette}>
        <Field label="Theme" description="Choose the visual theme for the interface.">
          <select
            value={settings.theme}
            onChange={e => update('theme', e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm w-36 focus:outline-none focus:border-blue-500"
          >
            <option value="light">Light</option>
            <option value="dark">Dark (Coming Soon)</option>
          </select>
        </Field>
        <Field label="Language" description="Interface display language.">
          <select
            value={settings.language}
            onChange={e => update('language', e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm w-36 focus:outline-none focus:border-blue-500"
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </Field>
      </Section>

      {/* System Info */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wider">System Info</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <span>Frontend: React + Vite + Tailwind CSS</span>
          <span>Backend: Node.js + Express.js</span>
          <span>Database: SQLite (better-sqlite3)</span>
          <span>ML: Python + Scikit-learn</span>
        </div>
      </div>
    </div>
  );
}
