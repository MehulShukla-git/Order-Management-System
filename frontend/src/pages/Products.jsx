import { useState, useEffect } from 'react';
import axios from 'axios';
import { LoaderCircle, Plus, Trash2, X } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState({
    product_name: '',
    sku: '',
    category: '',
    description: '',
    price: '',
    cost_price: '',
    initial_stock: '',
    low_stock_threshold: '',
  });

  const loadProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/products');
      setProducts(response.data.data);
      setLoadError('');
    } catch (error) {
      setLoadError(error.response?.data?.message || 'Unable to load products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const fetchInitialProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/products', { signal: controller.signal });
        setProducts(response.data.data);
        setLoadError('');
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(error.response?.data?.message || 'Unable to load products. Please try again.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };
    fetchInitialProducts();
    return () => controller.abort();
  }, []);

  const openForm = () => {
    setForm({
      product_name: '',
      sku: '',
      category: '',
      description: '',
      price: '',
      cost_price: '',
      initial_stock: '',
      low_stock_threshold: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    const price = Number(form.price);
    const costPrice = Number(form.cost_price);
    const stock = Number(form.initial_stock);
    const lowStockThreshold = Number(form.low_stock_threshold);
    if (!form.product_name.trim() || !form.sku.trim() || !form.category.trim()) {
      setFormError('Product name, SKU, and category are required.');
      return;
    }
    if (!Number.isFinite(price) || price < 0 || !Number.isFinite(costPrice) || costPrice < 0) {
      setFormError('Price and cost price must be valid non-negative numbers.');
      return;
    }
    if (!Number.isInteger(stock) || stock < 0 || !Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
      setFormError('Stock and low-stock threshold must be non-negative whole numbers.');
      return;
    }

    setIsSaving(true);
    try {
      await axios.post('http://localhost:5000/api/products', {
        product_name: form.product_name.trim(),
        sku: form.sku.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        price,
        cost_price: costPrice,
        initial_stock: stock,
        low_stock_threshold: lowStockThreshold,
      });
      setIsModalOpen(false);
      setIsLoading(true);
      await loadProducts();
    } catch (error) {
      setFormError(error.response?.data?.message || 'Unable to create product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await axios.delete(`http://localhost:5000/api/products/${productToDelete.id}`);
      setProductToDelete(null);
      setIsLoading(true);
      await loadProducts();
    } catch (error) {
      setDeleteError(error.response?.data?.message || 'Unable to delete product. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'IN STOCK': return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">{status}</span>;
      case 'LOW STOCK': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">{status}</span>;
      case 'OUT OF STOCK': return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">{status}</span>;
      default: return null;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <button
          type="button"
          onClick={openForm}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {loadError && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              loadProducts();
            }}
            className="ml-2 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Product</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">SKU</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Category</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Price</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Stock</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-500">Loading products...</td></tr>
              ) : products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{p.product_name}</td>
                  <td className="px-6 py-4 text-gray-500">{p.sku}</td>
                  <td className="px-6 py-4 text-gray-500">{p.category}</td>
                  <td className="px-6 py-4 text-gray-900">${Number(p.price).toFixed(2)}</td>
                  <td className="px-6 py-4 text-gray-500">{p.current_stock}</td>
                  <td className="px-6 py-4">{getStatusBadge(p.stock_status)}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      aria-label={`Delete ${p.product_name}`}
                      onClick={() => {
                        setDeleteError('');
                        setProductToDelete(p);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && products.length === 0 && !loadError && (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={event => {
            if (event.target === event.currentTarget && !isSaving) setIsModalOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-product-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 id="add-product-title" className="text-xl font-bold text-gray-900">Add Product</h2>
              <button
                type="button"
                aria-label="Close"
                disabled={isSaving}
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-gray-700">
                  Product name *
                  <input name="product_name" value={form.product_name} onChange={updateForm} required maxLength="200" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  SKU *
                  <input name="sku" value={form.sku} onChange={updateForm} required maxLength="100" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Category *
                  <input name="category" value={form.category} onChange={updateForm} required maxLength="100" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Price *
                  <input name="price" type="number" value={form.price} onChange={updateForm} required min="0" step="any" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Cost price *
                  <input name="cost_price" type="number" value={form.cost_price} onChange={updateForm} required min="0" step="any" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Initial stock *
                  <input name="initial_stock" type="number" value={form.initial_stock} onChange={updateForm} required min="0" step="1" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </label>
                <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
                  Low-stock threshold *
                  <input name="low_stock_threshold" type="number" value={form.low_stock_threshold} onChange={updateForm} required min="0" step="1" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </label>
                <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
                  Description
                  <textarea name="description" value={form.description} onChange={updateForm} rows="3" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </label>
              </div>
              {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" disabled={isSaving} onClick={() => setIsModalOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {isSaving && <LoaderCircle size={16} className="animate-spin" />}
                  {isSaving ? 'Saving...' : 'Create Product'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-product-title"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
          >
            <h2 id="delete-product-title" className="text-xl font-bold text-gray-900">Delete Product?</h2>
            <p className="mt-3 text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{productToDelete.product_name}</span>
              {' '}({productToDelete.sku})
            </p>
            <p className="mt-2 text-sm text-gray-600">This product will be removed. Products with order or inventory history cannot be deleted.</p>
            {deleteError && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{deleteError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" disabled={isDeleting} onClick={() => setProductToDelete(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                Cancel
              </button>
              <button type="button" disabled={isDeleting} onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                {isDeleting ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Products;
