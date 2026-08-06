import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, X, GripVertical, Loader2, Upload, Star } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminProduct, createProduct, updateProduct, uploadProductImage } from '@/services/adminProductService';

const CATEGORIES = [
  { value: 'saree', label: 'Sarees' },
  { value: 'skincare', label: 'Skincare' },
];

const emptyProduct = {
  name: '',
  slug: '',
  category: 'saree',
  shortDescription: '',
  longDescription: '',
  price: '',
  comparePrice: '',
  images: [],
  tag: '',
  stock: '0',
  specifications: [],
  shippingInfo: '',
  featured: false,
  active: true,
};

export default function AdminProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = id && id !== 'new';

  const [form, setForm] = useState(emptyProduct);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [errors, setErrors] = useState({});
  const [imageUploading, setImageUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const fileInputRef = useRef(null);

  // Load product for editing
  useEffect(() => {
    if (!isEditing) return;

    let mounted = true;
    setInitialLoading(true);
    getAdminProduct(id).then((res) => {
      if (!mounted) return;
      if (res.ok && res.product) {
        const p = res.product;
        setForm({
          name: p.name || '',
          slug: p.slug || '',
          category: p.category || 'saree',
          shortDescription: p.short_description || '',
          longDescription: p.long_description || '',
          price: p.price?.toString() || '',
          comparePrice: p.compare_price?.toString() || '',
          images: p.images || [],
          tag: p.tag || '',
          stock: p.stock?.toString() || '0',
          specifications: p.specifications || [],
          shippingInfo: (p.shipping_info || []).join('\n'),
          featured: p.featured || false,
          active: p.active !== false,
        });
      } else {
        toast.error(res.error || 'Product not found');
        navigate('/admin/products');
      }
      setInitialLoading(false);
    });

    return () => { mounted = false; };
  }, [id, isEditing, navigate]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Auto-generate slug from name
    if (field === 'name' && !isEditing) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setForm((prev) => ({ ...prev, slug }));
    }
    // Clear error when field changes
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    const res = await uploadProductImage(file);
    setImageUploading(false);

    if (res.ok) {
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, res.url],
      }));
      toast.success('Image uploaded');
    } else {
      toast.error(res.error || 'Failed to upload image');
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...form.images];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);
    setForm((prev) => ({ ...prev, images: newImages }));
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSpecChange = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      specifications: prev.specifications.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      ),
    }));
  };

  const handleAddSpec = () => {
    setForm((prev) => ({
      ...prev,
      specifications: [...prev.specifications, { label: '', value: '' }],
    }));
  };

  const handleRemoveSpec = (index) => {
    setForm((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Product name is required';
    if (!form.slug.trim()) errs.slug = 'Slug is required';
    if (!form.category) errs.category = 'Category is required';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) {
      errs.price = 'Valid price is required (0 or greater)';
    }
    if (form.comparePrice && (isNaN(Number(form.comparePrice)) || Number(form.comparePrice) < 0)) {
      errs.comparePrice = 'Compare price must be 0 or greater';
    }
    // Check slug format
    if (form.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) {
      errs.slug = 'Slug must be lowercase alphanumeric with hyphens only';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    setLoading(true);

    const productData = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      category: form.category,
      shortDescription: form.shortDescription.trim(),
      longDescription: form.longDescription.trim(),
      price: Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
      images: form.images,
      tag: form.tag.trim() || null,
      stock: Number(form.stock) || 0,
      specifications: form.specifications.filter((s) => s.label.trim() && s.value.trim()),
      shippingInfo: form.shippingInfo.split('\n').filter((s) => s.trim()),
      featured: form.featured,
      active: form.active,
    };

    const res = isEditing
      ? await updateProduct(id, productData)
      : await createProduct(productData);

    setLoading(false);

    if (res.ok) {
      toast.success(isEditing ? 'Product updated' : 'Product created');
      navigate('/admin/products');
    } else {
      toast.error(res.error || 'Failed to save product');
      // Handle duplicate slug error
      if (res.error?.includes('slug')) {
        setErrors((prev) => ({ ...prev, slug: res.error }));
      }
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B2956]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/products')}
          className="clay-btn-ghost h-10 px-4 flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="font-serif-display text-4xl text-[#8B2956]">
          {isEditing ? 'Edit Product' : 'Add Product'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Section */}
        <div className="clay-card p-6">
          <h2 className="font-serif-display text-xl text-[#8B2956] mb-4">General</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="product-name" className="block text-sm font-medium text-[#2E2825]/70 mb-1">
                Product Name *
              </label>
              <input
                id="product-name"
                type="text"
                className={`clay-input w-full ${errors.name ? 'border-[#C62828]' : ''}`}
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. Magenta & Olive Heritage Silk"
              />
              {errors.name && <p className="text-xs text-[#C62828] mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="product-slug" className="block text-sm font-medium text-[#2E2825]/70 mb-1">
                Slug *
              </label>
              <input
                id="product-slug"
                type="text"
                className={`clay-input w-full ${errors.slug ? 'border-[#C62828]' : ''}`}
                value={form.slug}
                onChange={(e) => handleChange('slug', e.target.value)}
                placeholder="e.g. saree-magenta-olive"
              />
              {errors.slug && <p className="text-xs text-[#C62828] mt-1">{errors.slug}</p>}
              <p className="text-xs text-[#2E2825]/40 mt-1">
                Used in URL: /products/{form.slug || 'your-slug'}
              </p>
            </div>

            <div>
              <label htmlFor="product-category" className="block text-sm font-medium text-[#2E2825]/70 mb-1">
                Category *
              </label>
              <select
                id="product-category"
                className={`clay-input w-full ${errors.category ? 'border-[#C62828]' : ''}`}
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              {errors.category && <p className="text-xs text-[#C62828] mt-1">{errors.category}</p>}
            </div>

            <div>
              <label htmlFor="product-tag" className="block text-sm font-medium text-[#2E2825]/70 mb-1">
                Tag (optional)
              </label>
              <input
                id="product-tag"
                type="text"
                className="clay-input w-full"
                value={form.tag}
                onChange={(e) => handleChange('tag', e.target.value)}
                placeholder="e.g. Bestseller, New, Premium"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="product-short-desc" className="block text-sm font-medium text-[#2E2825]/70 mb-1">
                Short Description
              </label>
              <textarea
                id="product-short-desc"
                className="clay-input w-full h-20 resize-none"
                value={form.shortDescription}
                onChange={(e) => handleChange('shortDescription', e.target.value)}
                placeholder="Brief description shown on product cards"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="product-long-desc" className="block text-sm font-medium text-[#2E2825]/70 mb-1">
                Full Description
              </label>
              <textarea
                id="product-long-desc"
                className="clay-input w-full h-32 resize-none"
                value={form.longDescription}
                onChange={(e) => handleChange('longDescription', e.target.value)}
                placeholder="Detailed description for the product page"
              />
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="clay-card p-6">
          <h2 className="font-serif-display text-xl text-[#8B2956] mb-4">Pricing</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="product-price" className="block text-sm font-medium text-[#2E2825]/70 mb-1">
                Price (₹) *
              </label>
              <input
                id="product-price"
                type="number"
                min="0"
                className={`clay-input w-full ${errors.price ? 'border-[#C62828]' : ''}`}
                value={form.price}
                onChange={(e) => handleChange('price', e.target.value)}
                placeholder="0"
              />
              {errors.price && <p className="text-xs text-[#C62828] mt-1">{errors.price}</p>}
            </div>

            <div>
              <label htmlFor="product-compare-price" className="block text-sm font-medium text-[#2E2825]/70 mb-1">
                Compare Price (₹) (optional)
              </label>
              <input
                id="product-compare-price"
                type="number"
                min="0"
                className={`clay-input w-full ${errors.comparePrice ? 'border-[#C62828]' : ''}`}
                value={form.comparePrice}
                onChange={(e) => handleChange('comparePrice', e.target.value)}
                placeholder="e.g. 1999"
              />
              <p className="text-xs text-[#2E2825]/40 mt-1">
                Show original price crossed out
              </p>
              {errors.comparePrice && <p className="text-xs text-[#C62828] mt-1">{errors.comparePrice}</p>}
            </div>

            <div>
              <label htmlFor="product-stock" className="block text-sm font-medium text-[#2E2825]/70 mb-1">
                Stock Quantity
              </label>
              <input
                id="product-stock"
                type="number"
                min="0"
                className="clay-input w-full"
                value={form.stock}
                onChange={(e) => handleChange('stock', e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Display Section */}
        <div className="clay-card p-6">
          <h2 className="font-serif-display text-xl text-[#8B2956] mb-4">Display</h2>
          <div className="flex flex-col sm:flex-row gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => handleChange('featured', e.target.checked)}
                className="sr-only peer"
              />
              <div className={`w-12 h-7 rounded-full transition-colors peer-checked:bg-[#8B2956] ${form.featured ? 'bg-[#8B2956]' : 'bg-[#EADFE5]'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md mt-1 transition-transform ml-1 ${form.featured ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm font-medium text-[#2E2825]">Featured Product</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => handleChange('active', e.target.checked)}
                className="sr-only peer"
              />
              <div className={`w-12 h-7 rounded-full transition-colors peer-checked:bg-[#2E7D32] ${form.active ? 'bg-[#2E7D32]' : 'bg-[#EADFE5]'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-md mt-1 transition-transform ml-1 ${form.active ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm font-medium text-[#2E2825]">Active (visible on store)</span>
            </label>
          </div>
        </div>

        {/* Images Section */}
        <div className="clay-card p-6">
          <h2 className="font-serif-display text-xl text-[#8B2956] mb-4">Images</h2>
          <p className="text-sm text-[#2E2825]/60 mb-4">
            The first image will be used as the main product image. Drag to reorder.
          </p>

          <div className="flex flex-wrap gap-4 mb-4">
            {form.images.map((img, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative group w-24 h-24 rounded-xl overflow-hidden cursor-grab ${
                  draggedIndex === index ? 'opacity-50' : ''
                } ${index === 0 ? 'ring-2 ring-[#8B2956]' : ''}`}
              >
                <img src={img} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                <div className="absolute top-1 left-1 bg-[#8B2956] text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                  {index === 0 ? 'Main' : index + 1}
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <GripVertical className="w-5 h-5 text-white" />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-[#C62828] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            <label className="w-24 h-24 rounded-xl border-2 border-dashed border-[#EADFE5] flex flex-col items-center justify-center cursor-pointer hover:border-[#8B2956] hover:bg-[#FAF5F8] transition-colors">
              {imageUploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-[#8B2956]" />
              ) : (
                <>
                  <Upload className="w-6 h-6 text-[#2E2825]/40" />
                  <span className="text-xs text-[#2E2825]/40 mt-1">Upload</span>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleImageUpload}
                disabled={imageUploading}
              />
            </label>
          </div>
        </div>

        {/* Specifications Section */}
        <div className="clay-card p-6">
          <h2 className="font-serif-display text-xl text-[#8B2956] mb-4">Specifications</h2>
          <div className="space-y-3">
            {form.specifications.map((spec, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  className="clay-input flex-1"
                  placeholder="Label (e.g. Material)"
                  value={spec.label}
                  onChange={(e) => handleSpecChange(index, 'label', e.target.value)}
                />
                <input
                  type="text"
                  className="clay-input flex-1"
                  placeholder="Value (e.g. Pure Silk)"
                  value={spec.value}
                  onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSpec(index)}
                  className="clay-btn-ghost h-10 w-10 flex items-center justify-center text-[#C62828]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddSpec}
              className="clay-btn-ghost h-10 px-4 flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Add Specification
            </button>
          </div>
        </div>

        {/* Shipping Info Section */}
        <div className="clay-card p-6">
          <h2 className="font-serif-display text-xl text-[#8B2956] mb-4">Shipping & Returns</h2>
          <textarea
            className="clay-input w-full h-40 resize-none"
            value={form.shippingInfo}
            onChange={(e) => handleChange('shippingInfo', e.target.value)}
            placeholder="Enter each line of shipping info on a new line, e.g.:&#10;Dispatched within 2-3 business days&#10;Free shipping on orders above ₹5,000&#10;7-day returns"
          />
          <p className="text-xs text-[#2E2825]/40 mt-2">
            Each line will appear as a separate bullet point
          </p>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="clay-btn-ghost h-12 px-6"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="clay-btn-primary h-12 px-8 flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Star className="w-5 h-5" />
                {isEditing ? 'Update Product' : 'Create Product'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
