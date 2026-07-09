import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Upload, Loader2, Tag, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const STATUSES = ['active', 'inactive', 'draft', 'archived'];

function FormField({ label, children, hint, required }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-zinc-600">{hint}</p>}
    </div>
  );
}

const inputClass = "bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500/20 w-full transition-all";

export default function AdminProductForm({ product, categories = [], apiFetch, onSuccess, onClose }) {
  const isEditing = !!product;

  const [form, setForm] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
    brand: '',
    price: '',
    discountPrice: '',
    discountPercentage: '',
    stock: '',
    status: 'active',
    featured: false,
    bestSeller: false,
    metaTitle: '',
    metaDescription: ''
  });

  const [images, setImages] = useState([]); // { url, alt, isPrimary }
  const [imageFiles, setImageFiles] = useState([]);
  const [variants, setVariants] = useState([]); // { name, value, sku, price, stock }
  const [specs, setSpecs] = useState([]); // { key, value }
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Pre-fill form when editing an existing product
  useEffect(() => {
    if (product) {
      setForm({
        sku: product.sku || '',
        name: product.name || '',
        description: product.description || '',
        category: product.category?._id || product.category || '',
        brand: product.brand || '',
        price: product.price || '',
        discountPrice: product.discountPrice || '',
        discountPercentage: product.discountPercentage || '',
        stock: product.stock ?? '',
        status: product.status || 'active',
        featured: product.featured || false,
        bestSeller: product.bestSeller || false,
        metaTitle: product.metaTitle || '',
        metaDescription: product.metaDescription || ''
      });
      if (product.images) setImages(product.images);
      if (product.variants) setVariants(product.variants.map(v => ({ ...v })));
      if (product.specifications) {
        const entries = product.specifications instanceof Map
          ? Array.from(product.specifications.entries())
          : Object.entries(product.specifications);
        setSpecs(entries.map(([key, value]) => ({ key, value })));
      }
      if (product.tags) setTags(product.tags.join(', '));
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // Auto-calculate discount percentage when both prices set
  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      const price = parseFloat(name === 'price' ? value : prev.price);
      const discountPrice = parseFloat(name === 'discountPrice' ? value : prev.discountPrice);
      if (price > 0 && discountPrice > 0 && discountPrice < price) {
        updated.discountPercentage = Math.round(((price - discountPrice) / price) * 100);
      } else {
        updated.discountPercentage = 0;
      }
      return updated;
    });
  };

  // Image file picker
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(prev => [...prev, ...files]);
  };

  const removeImageFile = (idx) => setImageFiles(prev => prev.filter((_, i) => i !== idx));
  const removeExistingImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));

  // Variants management
  const addVariant = () => setVariants(prev => [...prev, { name: '', value: '', sku: '', price: '', stock: 0 }]);
  const updateVariant = (idx, field, value) => setVariants(prev => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  const removeVariant = (idx) => setVariants(prev => prev.filter((_, i) => i !== idx));

  // Specs management
  const addSpec = () => setSpecs(prev => [...prev, { key: '', value: '' }]);
  const updateSpec = (idx, field, value) => setSpecs(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  const removeSpec = (idx) => setSpecs(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.sku.trim() || !form.name.trim() || !form.price) {
      setError('SKU, product name, and price are required.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();

      // Append basic fields
      Object.entries(form).forEach(([key, val]) => {
        if (val !== '' && val !== null && val !== undefined) {
          formData.append(key, val);
        }
      });

      // Append new image files
      imageFiles.forEach(file => formData.append('images', file));

      // Append existing images as JSON (for editing)
      if (isEditing && images.length > 0) {
        formData.append('existingImages', JSON.stringify(images));
      }

      // Append variants and specs
      formData.append('variants', JSON.stringify(variants.filter(v => v.name && v.value)));
      const specsObj = {};
      specs.filter(s => s.key && s.value).forEach(s => { specsObj[s.key] = s.value; });
      formData.append('specifications', JSON.stringify(specsObj));
      formData.append('tags', JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean)));

      const url = isEditing ? `/api/products/${product.id || product._id}` : '/api/products';
      const method = isEditing ? 'PUT' : 'POST';

      const result = await apiFetch(url, {
        method,
        body: formData,
        // Note: Do NOT set Content-Type; browser auto-sets multipart/form-data with boundary
        headers: {} // override any default JSON header
      });

      if (result?.error) {
        setError(result.error);
      } else {
        onSuccess(result, isEditing);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-3xl my-6 overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-950 border border-indigo-900 p-2 rounded-lg">
                <Package className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-display font-semibold text-white">
                  {isEditing ? 'Edit Product' : 'Add New Product'}
                </h2>
                <p className="text-xs text-zinc-500">{isEditing ? `Editing: ${product.name}` : 'Fill in the product details below'}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">

            {error && (
              <div className="bg-red-950/40 border border-red-900/60 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Core Fields Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Product Name" required>
                <input className={inputClass} name="name" value={form.name} onChange={handleChange} placeholder="e.g. HP Pavilion Laptop" required />
              </FormField>
              <FormField label="SKU" required hint="Unique product identifier (e.g. HP-LAP-I5-001)">
                <input className={inputClass} name="sku" value={form.sku} onChange={handleChange} placeholder="HP-LAP-I5-001" required />
              </FormField>
            </div>

            <FormField label="Description">
              <textarea className={`${inputClass} resize-none`} name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Describe the product in detail..." />
            </FormField>

            {/* Category, Brand, Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Category">
                <select className={inputClass} name="category" value={form.category} onChange={handleChange}>
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Brand">
                <input className={inputClass} name="brand" value={form.brand} onChange={handleChange} placeholder="e.g. HP, Sony, Logitech" />
              </FormField>
              <FormField label="Status">
                <select className={inputClass} name="status" value={form.status} onChange={handleChange}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </FormField>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Price (₹)" required>
                <input className={inputClass} name="price" type="number" min="0" step="0.01" value={form.price} onChange={handlePriceChange} placeholder="0.00" required />
              </FormField>
              <FormField label="Discount Price (₹)" hint="Leave empty for no discount">
                <input className={inputClass} name="discountPrice" type="number" min="0" step="0.01" value={form.discountPrice} onChange={handlePriceChange} placeholder="0.00" />
              </FormField>
              <FormField label="Discount %" hint="Auto-calculated">
                <input className={`${inputClass} text-amber-400`} name="discountPercentage" type="number" min="0" max="100" value={form.discountPercentage} onChange={handleChange} placeholder="0" readOnly={form.price && form.discountPrice} />
              </FormField>
            </div>

            {/* Stock */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Stock Quantity" required>
                <input className={inputClass} name="stock" type="number" min="0" value={form.stock} onChange={handleChange} placeholder="0" required />
              </FormField>
              <FormField label="Tags" hint="Comma separated: gaming, rgb, wireless">
                <input className={inputClass} value={tags} onChange={e => setTags(e.target.value)} placeholder="gaming, rgb, wireless" />
              </FormField>
            </div>

            {/* Toggles */}
            <div className="flex gap-6">
              {[{ name: 'featured', label: '⭐ Featured' }, { name: 'bestSeller', label: '🔥 Best Seller' }].map(({ name, label }) => (
                <label key={name} className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input type="checkbox" name={name} checked={form[name]} onChange={handleChange} className="sr-only" />
                    <div className={`w-10 h-5 rounded-full transition-colors ${form[name] ? 'bg-amber-500' : 'bg-zinc-800'}`} />
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${form[name] ? 'translate-x-5' : ''}`} />
                  </div>
                  <span className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">{label}</span>
                </label>
              ))}
            </div>

            {/* Image Upload */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Product Images</p>

              {/* Existing Images */}
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-zinc-800 group">
                      <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                      {img.isPrimary && <span className="absolute top-0 left-0 bg-amber-500 text-zinc-950 text-[8px] font-bold px-1">Primary</span>}
                      <button
                        type="button"
                        onClick={() => removeExistingImage(idx)}
                        className="absolute inset-0 bg-red-950/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* New Files Preview */}
              {imageFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {imageFiles.map((file, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-zinc-700 group">
                      <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImageFile(idx)}
                        className="absolute inset-0 bg-red-950/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="flex items-center gap-3 p-4 bg-zinc-900/50 border border-dashed border-zinc-700 hover:border-amber-500/50 rounded-xl cursor-pointer group transition-all">
                <Upload className="w-5 h-5 text-zinc-500 group-hover:text-amber-500 transition-colors" />
                <div>
                  <p className="text-sm text-zinc-400 group-hover:text-zinc-200 transition-colors">Upload images (up to 5)</p>
                  <p className="text-[10px] text-zinc-600">JPG, PNG, WebP — max 10MB each</p>
                </div>
                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="sr-only" />
              </label>
            </div>

            {/* Advanced Section — Variants & Specs */}
            <div className="border border-zinc-900 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setAdvancedOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900/50 text-left"
              >
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Advanced — Variants & Specifications</span>
                {advancedOpen ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
              </button>

              <AnimatePresence>
                {advancedOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 space-y-6">
                      {/* Variants */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Variants</p>
                          <button type="button" onClick={addVariant} className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors">
                            <Plus className="w-3 h-3" /> Add Variant
                          </button>
                        </div>
                        {variants.length === 0 ? (
                          <p className="text-xs text-zinc-600 italic">No variants. Click 'Add Variant' to define Color, Size, Storage etc.</p>
                        ) : (
                          <div className="space-y-2">
                            {variants.map((v, idx) => (
                              <div key={idx} className="grid grid-cols-6 gap-2 items-center">
                                <input className={`${inputClass} col-span-1`} placeholder="Name (e.g. Color)" value={v.name} onChange={e => updateVariant(idx, 'name', e.target.value)} />
                                <input className={`${inputClass} col-span-1`} placeholder="Value (e.g. Black)" value={v.value} onChange={e => updateVariant(idx, 'value', e.target.value)} />
                                <input className={`${inputClass} col-span-1`} placeholder="SKU" value={v.sku} onChange={e => updateVariant(idx, 'sku', e.target.value)} />
                                <input className={`${inputClass} col-span-1`} placeholder="Price" type="number" value={v.price} onChange={e => updateVariant(idx, 'price', e.target.value)} />
                                <input className={`${inputClass} col-span-1`} placeholder="Stock" type="number" value={v.stock} onChange={e => updateVariant(idx, 'stock', e.target.value)} />
                                <button type="button" onClick={() => removeVariant(idx)} className="text-red-500 hover:text-red-400 flex justify-center col-span-1">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Specifications */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Specifications</p>
                          <button type="button" onClick={addSpec} className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors">
                            <Plus className="w-3 h-3" /> Add Spec
                          </button>
                        </div>
                        {specs.length === 0 ? (
                          <p className="text-xs text-zinc-600 italic">No specs. Click 'Add Spec' to define RAM, Processor, etc.</p>
                        ) : (
                          <div className="space-y-2">
                            {specs.map((s, idx) => (
                              <div key={idx} className="flex gap-2 items-center">
                                <input className={`${inputClass} flex-1`} placeholder="Key (e.g. RAM)" value={s.key} onChange={e => updateSpec(idx, 'key', e.target.value)} />
                                <input className={`${inputClass} flex-1`} placeholder="Value (e.g. 16GB)" value={s.value} onChange={e => updateSpec(idx, 'value', e.target.value)} />
                                <button type="button" onClick={() => removeSpec(idx)} className="text-red-500 hover:text-red-400">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* SEO */}
                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">SEO Fields</p>
                        <FormField label="Meta Title">
                          <input className={inputClass} name="metaTitle" value={form.metaTitle} onChange={handleChange} placeholder="SEO optimized title" />
                        </FormField>
                        <FormField label="Meta Description">
                          <textarea className={`${inputClass} resize-none`} name="metaDescription" value={form.metaDescription} onChange={handleChange} rows={2} placeholder="Brief description for search engines..." />
                        </FormField>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-sm font-medium transition-colors border border-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
