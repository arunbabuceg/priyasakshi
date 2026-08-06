import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Loader2, Plus, Edit, Copy, Eye, EyeOff, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminProducts, deleteProduct, duplicateProduct, toggleProductStatus } from '@/services/adminProductService';
import { formatINR } from '@/lib/format';
import { imageUrl } from '@/lib/imageUrl';

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'saree', label: 'Sarees' },
  { value: 'skincare', label: 'Skincare' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'hidden', label: 'Hidden' },
];

const formatDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso || '—';
  }
};

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState({});

  const fetchProducts = React.useCallback(() => {
    setLoading(true);
    const filters = { search: search || undefined };
    if (category) filters.category = category;
    if (status === 'active') filters.active = true;
    if (status === 'hidden') filters.active = false;

    getAdminProducts(filters)
      .then((res) => {
        if (res.ok) {
          setProducts(res.products || []);
          setTotal(res.total || 0);
        } else {
          toast.error(res.error || 'Failed to load products');
          setProducts([]);
        }
      })
      .catch(() => {
        toast.error('Failed to load products');
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, [search, category, status]);

  useEffect(() => {
    let mounted = true;
    const t = setTimeout(() => {
      if (mounted) fetchProducts();
    }, 250);
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [fetchProducts]);

  const handleDelete = async (product) => {
    if (!confirm(`Delete "${product.name}"? This will hide it from the storefront but preserve it in historical orders.`)) {
      return;
    }
    setActionLoading((prev) => ({ ...prev, [product.id]: 'delete' }));
    const res = await deleteProduct(product.id);
    setActionLoading((prev) => ({ ...prev, [product.id]: null }));
    if (res.ok) {
      toast.success('Product deleted');
      fetchProducts();
    } else {
      toast.error(res.error || 'Failed to delete product');
    }
  };

  const handleDuplicate = async (product) => {
    setActionLoading((prev) => ({ ...prev, [product.id]: 'duplicate' }));
    const res = await duplicateProduct(product.id);
    setActionLoading((prev) => ({ ...prev, [product.id]: null }));
    if (res.ok) {
      toast.success('Product duplicated');
      fetchProducts();
    } else {
      toast.error(res.error || 'Failed to duplicate product');
    }
  };

  const handleToggle = async (product) => {
    setActionLoading((prev) => ({ ...prev, [product.id]: 'toggle' }));
    const res = await toggleProductStatus(product.id);
    setActionLoading((prev) => ({ ...prev, [product.id]: null }));
    if (res.ok) {
      toast.success(res.product.active ? 'Product is now active' : 'Product is now hidden');
      fetchProducts();
    } else {
      toast.error(res.error || 'Failed to toggle status');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif-display text-4xl text-[#8B2956]">Products</h1>
        <Link to="/admin/products/new" className="clay-btn-primary h-12 px-6 flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="clay-card p-4 mb-6 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#2E2825]/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          <input
            className="clay-input !pl-11"
            placeholder="Search by name or description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="clay-input md:w-44"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          className="clay-input md:w-44"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="clay-card p-4 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-[#2E2825]/60">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading products…
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center">
            <ImageIcon className="w-12 h-12 mx-auto text-[#2E2825]/20 mb-3" />
            <p className="text-sm text-[#2E2825]/60">No products found.</p>
            <Link to="/admin/products/new" className="clay-btn-primary h-10 px-4 mt-4 inline-flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> Add your first product
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-widest text-[#2E2825]/50 border-b border-[#EADFE5]">
                <th className="pb-3 pr-4 w-16">Image</th>
                <th className="pb-3 pr-4">Product Name</th>
                <th className="pb-3 pr-4 hidden md:table-cell">Category</th>
                <th className="pb-3 pr-4">Price</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4 hidden lg:table-cell">Featured</th>
                <th className="pb-3 pr-4 hidden sm:table-cell">Updated</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[#EADFE5] last:border-0 hover:bg-[#FAF5F8]/60"
                >
                  <td className="py-3 pr-4">
                    {p.images && p.images.length > 0 ? (
                      <img
                        src={imageUrl(p.images[0])}
                        alt={p.name}
                        className="w-12 h-12 rounded-xl object-cover bg-[#F5EBF0]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#F5EBF0] flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-[#2E2825]/30" />
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="font-medium text-[#2E2825]">{p.name}</div>
                    {p.tag && (
                      <span className="text-xs text-[#8B2956]">{p.tag}</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 hidden md:table-cell">
                    <span className="capitalize text-[#2E2825]/70">
                      {p.category === 'saree' ? 'Sarees' : p.category === 'skincare' ? 'Skincare' : p.category}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-semibold text-[#2E2825]">
                    {formatINR(p.price)}
                    {p.compare_price && p.compare_price > p.price && (
                      <span className="ml-2 text-xs text-[#2E2825]/40 line-through">
                        {formatINR(p.compare_price)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`clay-pill ${
                        p.active
                          ? 'bg-[#E8F5E9] text-[#2E7D32]'
                          : 'bg-[#FFEBEE] text-[#C62828]'
                      }`}
                    >
                      {p.active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="py-3 pr-4 hidden lg:table-cell">
                    {p.featured ? (
                      <span className="clay-pill bg-[#FFF8E1] text-[#F57F17]">Yes</span>
                    ) : (
                      <span className="text-[#2E2825]/40">No</span>
                    )}
                  </td>
                  <td className="py-3 pr-4 hidden sm:table-cell text-[#2E2825]/50 text-xs">
                    {formatDate(p.updated_at)}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/admin/products/${p.id}`)}
                        className="clay-btn-ghost h-9 w-9 flex items-center justify-center"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(p)}
                        disabled={actionLoading[p.id] === 'duplicate'}
                        className="clay-btn-ghost h-9 w-9 flex items-center justify-center"
                        title="Duplicate"
                      >
                        {actionLoading[p.id] === 'duplicate' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleToggle(p)}
                        disabled={actionLoading[p.id] === 'toggle'}
                        className="clay-btn-ghost h-9 w-9 flex items-center justify-center"
                        title={p.active ? 'Hide' : 'Show'}
                      >
                        {actionLoading[p.id] === 'toggle' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : p.active ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        disabled={actionLoading[p.id] === 'delete'}
                        className="clay-btn-ghost h-9 w-9 flex items-center justify-center text-[#C62828] hover:bg-[#FFEBEE]"
                        title="Delete"
                      >
                        {actionLoading[p.id] === 'delete' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-[#2E2825]/40 mt-3 text-right">
        {total} product{total !== 1 ? 's' : ''} total
      </p>
    </div>
  );
}
