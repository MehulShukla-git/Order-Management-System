import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, AlertCircle, Plus, Trash2, RotateCcw, X, LoaderCircle } from 'lucide-react';

const EMPTY_CUSTOMER = { name: '', email: '', phone: '', city: '' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [customerStatus, setCustomerStatus] = useState('active');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState(EMPTY_CUSTOMER);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [customerToRemove, setCustomerToRemove] = useState(null);
  const [removeError, setRemoveError] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);

  const fetchCustomers = async (status = customerStatus) => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get('http://localhost:5000/api/customers', { params: { status } });
      if (!res.data.success) throw new Error(res.data.message || 'Unable to load customers.');
      setCustomers(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers('active');
  }, []);

  const handleCreateCustomer = async (event) => {
    event.preventDefault();
    setFormError('');
    const name = newCustomer.name.trim();
    const email = newCustomer.email.trim();
    const phone = newCustomer.phone.trim();
    if (!name) {
      setFormError('Customer name is required.');
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Enter a valid email address.');
      return;
    }
    if (phone && (
      !/^\+?[\d\s().-]+$/.test(phone) ||
      phone.replace(/\D/g, '').length < 7 ||
      phone.replace(/\D/g, '').length > 15
    )) {
      setFormError('Enter a valid phone number.');
      return;
    }

    setIsSaving(true);
    try {
      await axios.post('http://localhost:5000/api/customers', {
        name,
        email,
        phone,
        city: newCustomer.city.trim(),
      });
      setIsAddOpen(false);
      setNewCustomer(EMPTY_CUSTOMER);
      setCustomerStatus('active');
      await fetchCustomers('active');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Unable to add customer. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveCustomer = async () => {
    if (!customerToRemove) return;
    setIsRemoving(true);
    setRemoveError('');
    try {
      await axios.delete(`http://localhost:5000/api/customers/${customerToRemove.id}`);
      setCustomerToRemove(null);
      await fetchCustomers(customerStatus);
    } catch (err) {
      setRemoveError(err.response?.data?.message || 'Unable to remove customer. Please try again.');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleRestoreCustomer = async (customer) => {
    setRemoveError('');
    try {
      await axios.patch(`http://localhost:5000/api/customers/${customer.id}/restore`);
      await fetchCustomers(customerStatus);
    } catch (err) {
      setRemoveError(err.response?.data?.message || 'Unable to restore customer. Please try again.');
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(search.toLowerCase()) ||
    (customer.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500">View and manage customer data.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormError('');
            setNewCustomer(EMPTY_CUSTOMER);
            setIsAddOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>Add Customer</span>
        </button>
      </div>

      {error && <div role="alert" className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={18} />{error}</div>}
      {removeError && !customerToRemove && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{removeError}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 p-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or email..."
              aria-label="Search customers by name or email"
              className="w-full rounded-lg border py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none"
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>
          <div className="flex gap-2" role="tablist" aria-label="Customer status">
            {['active', 'archived'].map(status => (
              <button
                key={status}
                type="button"
                role="tab"
                aria-selected={customerStatus === status}
                onClick={() => {
                  setCustomerStatus(status);
                  fetchCustomers(status);
                }}
                className={`rounded-lg px-3 py-2 text-sm font-medium capitalize ${customerStatus === status ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading customers...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 flex justify-center items-center gap-2">
            <AlertCircle /> {error}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No {customerStatus} customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider border-b">
                  <th className="p-4 font-medium">Customer Name</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">City</th>
                  <th className="p-4 font-medium text-right">Orders</th>
                  <th className="p-4 font-medium text-right">Total Spent</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                          {customer.name.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{customer.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{customer.email || '-'}</td>
                    <td className="p-4 text-gray-500">{customer.city || '-'}</td>
                    <td className="p-4 text-right text-gray-900 font-medium">{customer.order_count || 0}</td>
                    <td className="p-4 text-right text-gray-900 font-medium">${Number(customer.total_spent || 0).toFixed(2)}</td>
                    <td className="p-4 text-right">
                      {customerStatus === 'active' ? (
                        <button
                          type="button"
                          aria-label={`Remove ${customer.name}`}
                          onClick={() => {
                            setRemoveError('');
                            setCustomerToRemove(customer);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                          Remove
                        </button>
                      ) : (
                        <button
                          type="button"
                          aria-label={`Restore ${customer.name}`}
                          onClick={() => handleRestoreCustomer(customer)}
                          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                        >
                          <RotateCcw size={16} />
                          Restore
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

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="add-customer-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 id="add-customer-title" className="text-xl font-bold text-gray-900">Add Customer</h2>
              <button type="button" aria-label="Close" disabled={isSaving} onClick={() => setIsAddOpen(false)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Name *
                <input name="name" required maxLength="200" value={newCustomer.name} onChange={event => setNewCustomer(current => ({ ...current, name: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Email
                <input name="email" type="email" value={newCustomer.email} onChange={event => setNewCustomer(current => ({ ...current, email: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Phone
                <input name="phone" type="tel" value={newCustomer.phone} onChange={event => setNewCustomer(current => ({ ...current, phone: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </label>
              <label className="block text-sm font-medium text-gray-700">
                City / Location
                <input name="city" value={newCustomer.city} onChange={event => setNewCustomer(current => ({ ...current, city: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </label>
              {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" disabled={isSaving} onClick={() => setIsAddOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {isSaving && <LoaderCircle size={16} className="animate-spin" />}
                  {isSaving ? 'Saving...' : 'Create Customer'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {customerToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <section role="alertdialog" aria-modal="true" aria-labelledby="remove-customer-title" className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 id="remove-customer-title" className="text-xl font-bold text-gray-900">Remove Customer?</h2>
            <p className="mt-3 font-semibold text-gray-900">{customerToRemove.name}</p>
            {customerToRemove.email && <p className="text-sm text-gray-600">{customerToRemove.email}</p>}
            {customerToRemove.phone && <p className="text-sm text-gray-600">{customerToRemove.phone}</p>}
            {!customerToRemove.email && !customerToRemove.phone && <p className="text-sm text-gray-600">No email or phone on file</p>}
            {customerToRemove.order_count > 0 ? (
              <p className="mt-3 text-sm text-gray-600">This customer has order history. They will be removed from the active customer list, but their historical orders will be preserved.</p>
            ) : (
              <p className="mt-3 text-sm text-gray-600">Are you sure you want to remove this customer? With no order history, this customer will be permanently deleted.</p>
            )}
            {removeError && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{removeError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={isRemoving} onClick={() => setCustomerToRemove(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
              <button type="button" disabled={isRemoving} onClick={handleRemoveCustomer} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                {isRemoving ? 'Removing...' : 'Remove Customer'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
