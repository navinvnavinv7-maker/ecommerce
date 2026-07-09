import express from 'express';
import mongoose from 'mongoose';
import { products as memoryProducts, categories as memoryCategories } from '../models/memoryDB.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

const isDbConnected = () => mongoose.connection.readyState === 1;

// Helper to map DB/memory products to clean JSON matching frontend expectations
const mapProduct = (p) => {
  if (!p) return null;
  const obj = p.toObject ? p.toObject() : p;
  
  // Backward compatibility formatting
  const mainImage = obj.images && obj.images.length > 0 
    ? (obj.images.find(img => img.isPrimary)?.url || obj.images[0].url) 
    : (obj.image || 'from-zinc-700 to-zinc-800');

  const ratingVal = obj.ratings && obj.ratings.length > 0
    ? parseFloat((obj.ratings.reduce((sum, r) => sum + r.value, 0) / obj.ratings.length).toFixed(1))
    : (obj.rating || 5.0);

  const reviewsCountVal = obj.reviews ? obj.reviews.length : (obj.reviewsCount || 0);

  return {
    ...obj,
    id: obj.id || obj._id.toString(),
    image: mainImage,
    rating: ratingVal,
    reviewsCount: reviewsCountVal
  };
};

// ----------------------------------------------------
// CATEGORY ROUTES
// ----------------------------------------------------

// GET all categories
router.get('/categories', async (req, res) => {
  try {
    if (isDbConnected()) {
      const categories = await Category.find({}).sort({ name: 1 });
      return res.json(categories);
    }
  } catch (err) {
    console.error('MongoDB Categories fetch error:', err.message);
  }
  
  // Memory categories fallback matching categories structure
  res.json(memoryCategories);
});

// CREATE category (Admin Only)
router.post('/categories', verifyAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Category name is required." });
  }

  const slug = name.toLowerCase().trim().replace(/[\s_-]+/g, '-').replace(/[^\w-]/g, '');

  try {
    if (isDbConnected()) {
      const existing = await Category.findOne({ $or: [{ name }, { slug }] });
      if (existing) {
        return res.status(400).json({ error: "Category already exists." });
      }

      const newCategory = new Category({ name: name.trim(), slug });
      await newCategory.save();
      return res.status(201).json(newCategory);
    }
  } catch (err) {
    console.error('MongoDB Category creation error:', err.message);
  }

  res.status(201).json({ _id: 'cat_' + Date.now(), name: name.trim(), slug });
});

// ----------------------------------------------------
// PRODUCT ROUTES
// ----------------------------------------------------

// GET /api/products (Paginated, Searchable, Filterable)
router.get('/', async (req, res) => {
  const {
    search,
    category,
    brand,
    featured,
    bestSeller,
    minPrice,
    maxPrice,
    status,
    sort,
    page = 1,
    limit = 12
  } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skipNum = (pageNum - 1) * limitNum;

  try {
    if (isDbConnected()) {
      // 1. Build Query
      const query = {};

      // Standard customer view is restricted to active products while still
      // allowing older records without an explicit status to appear.
      if (status && ['draft', 'active', 'inactive', 'archived'].includes(status)) {
        query.status = status;
      } else {
        query.$or = [
          { status: 'active' },
          { status: { $exists: false } },
          { status: null }
        ];
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      if (category) {
        // If category is a slug, find it first
        if (mongoose.Types.ObjectId.isValid(category)) {
          query.category = category;
        } else {
          const categoryDoc = await Category.findOne({ slug: category.toLowerCase().trim() });
          if (categoryDoc) {
            query.category = categoryDoc._id;
          } else {
            query.category = null; // No match
          }
        }
      }

      if (brand) {
        query.brand = { $regex: brand, $options: 'i' };
      }

      if (featured !== undefined) {
        query.featured = featured === 'true';
      }

      if (bestSeller !== undefined) {
        query.bestSeller = bestSeller === 'true';
      }

      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = parseFloat(minPrice);
        if (maxPrice) query.price.$lte = parseFloat(maxPrice);
      }

      // 2. Build Sort
      let sortCriteria = { createdAt: -1 }; // default newest
      if (sort) {
        switch (sort) {
          case 'price_asc':
            sortCriteria = { price: 1 };
            break;
          case 'price_desc':
            sortCriteria = { price: -1 };
            break;
          case 'name_asc':
            sortCriteria = { name: 1 };
            break;
          case 'name_desc':
            sortCriteria = { name: -1 };
            break;
          default:
            sortCriteria = { createdAt: -1 };
        }
      }

      const totalProducts = await Product.countDocuments(query);
      const dbProducts = await Product.find(query)
        .populate('category')
        .sort(sortCriteria)
        .skip(skipNum)
        .limit(limitNum);

      return res.json({
        products: dbProducts.map(mapProduct),
        totalPages: Math.ceil(totalProducts / limitNum),
        currentPage: pageNum,
        totalProducts
      });
    }
  } catch (err) {
    console.error('MongoDB Product fetch error:', err.message);
  }

  // Fallback to memory DB
  let filtered = [...memoryProducts];

  // In-memory filters
  if (status) {
    filtered = filtered.filter(p => p.status === status);
  } else {
    // Return all for fallback view unless customer is explicitly specified
    filtered = filtered.filter(p => p.status !== 'inactive');
  }

  if (search) {
    const sLower = search.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(sLower) || 
      (p.description && p.description.toLowerCase().includes(sLower)) ||
      (p.brand && p.brand.toLowerCase().includes(sLower)) ||
      (p.sku && p.sku.toLowerCase().includes(sLower))
    );
  }

  if (category && category !== 'All') {
    filtered = filtered.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
  }

  if (brand) {
    filtered = filtered.filter(p => p.brand && p.brand.toLowerCase() === brand.toLowerCase());
  }

  if (featured !== undefined) {
    filtered = filtered.filter(p => p.featured === (featured === 'true'));
  }

  if (bestSeller !== undefined) {
    filtered = filtered.filter(p => p.bestSeller === (bestSeller === 'true'));
  }

  if (minPrice) {
    filtered = filtered.filter(p => p.price >= parseFloat(minPrice));
  }
  if (maxPrice) {
    filtered = filtered.filter(p => p.price <= parseFloat(maxPrice));
  }

  // In-memory sort
  if (sort) {
    if (sort === 'price_asc') filtered.sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') filtered.sort((a, b) => b.price - a.price);
    else if (sort === 'name_asc') filtered.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'name_desc') filtered.sort((a, b) => b.name.localeCompare(a.name));
  } else {
    filtered.sort((a, b) => b.id.localeCompare(a.id)); // mock reverse chronological
  }

  const total = filtered.length;
  const paginated = filtered.slice(skipNum, skipNum + limitNum);

  res.json({
    products: paginated.map(mapProduct),
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    totalProducts: total
  });
});

// GET details of a single product
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isDbConnected()) {
      let prod = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        prod = await Product.findById(id).populate('category');
      }
      if (!prod) {
        prod = await Product.findOne({ $or: [{ slug: id }, { sku: id }] }).populate('category');
      }
      if (prod) {
        return res.json(mapProduct(prod));
      }
    }
  } catch (err) {
    console.error('MongoDB Product detail fetch error:', err.message);
  }

  // Fallback to memory
  const prod = memoryProducts.find(p => p.id === id || p._id === id || p.slug === id);
  if (!prod) {
    return res.status(404).json({ error: "Product item not found." });
  }
  res.json(mapProduct(prod));
});

// CREATE new product (Admin Only)
router.post('/', verifyAdmin, upload.array('images', 5), async (req, res) => {
  const {
    sku,
    name,
    description,
    category,
    brand,
    price,
    discountPrice,
    discountPercentage,
    stock,
    specifications,
    variants,
    tags,
    featured,
    bestSeller,
    status,
    metaTitle,
    metaDescription
  } = req.body;

  if (!name || !sku || isNaN(parseFloat(price))) {
    return res.status(400).json({ error: "SKU, Product 'name', and valid numeric 'price' are required." });
  }

  // Parse arrays/objects from multipart form strings if needed
  let specs = {};
  if (specifications) {
    try {
      specs = typeof specifications === 'string' ? JSON.parse(specifications) : specifications;
    } catch (_) {}
  }

  let vars = [];
  if (variants) {
    try {
      vars = typeof variants === 'string' ? JSON.parse(variants) : variants;
    } catch (_) {}
  }

  let tagList = [];
  if (tags) {
    try {
      tagList = typeof tags === 'string' ? JSON.parse(tags) : tags;
    } catch (_) {
      if (typeof tags === 'string') tagList = tags.split(',').map(t => t.trim());
    }
  }

  // Uploaded images mapping
  const images = req.files ? req.files.map((file, idx) => ({
    url: file.path || `/uploads/${file.filename}`,
    alt: name,
    isPrimary: idx === 0
  })) : [];

  // Fallback to raw images URL string if passed (e.g. from frontend input)
  if (images.length === 0 && req.body.images) {
    try {
      const parsedImages = typeof req.body.images === 'string' ? JSON.parse(req.body.images) : req.body.images;
      if (Array.isArray(parsedImages)) {
        parsedImages.forEach(img => images.push({
          url: typeof img === 'string' ? img : img.url,
          alt: img.alt || name,
          isPrimary: img.isPrimary || false
        }));
      }
    } catch (_) {
      if (typeof req.body.images === 'string') {
        images.push({ url: req.body.images, alt: name, isPrimary: true });
      }
    }
  }

  const productData = {
    sku: sku.trim(),
    name: name.trim(),
    description: description || '',
    category: mongoose.Types.ObjectId.isValid(category) ? category : null,
    brand: brand || '',
    price: parseFloat(price),
    discountPrice: discountPrice ? parseFloat(discountPrice) : null,
    discountPercentage: discountPercentage ? parseInt(discountPercentage, 10) : 0,
    stock: stock ? parseInt(stock, 10) : 0,
    stockUpdatedAt: new Date(),
    images,
    variants: vars,
    specifications: specs,
    tags: tagList,
    featured: featured === 'true' || featured === true,
    bestSeller: bestSeller === 'true' || bestSeller === true,
    status: status || 'active',
    metaTitle: metaTitle || '',
    metaDescription: metaDescription || '',
    createdBy: req.user.id
  };

  try {
    if (isDbConnected()) {
      // Check unique SKU
      const existing = await Product.findOne({ sku: productData.sku });
      if (existing) {
        return res.status(400).json({ error: `Product with SKU "${productData.sku}" already exists.` });
      }

      const newProd = new Product(productData);
      await newProd.save();
      return res.status(201).json(mapProduct(newProd));
    }
  } catch (err) {
    console.error('MongoDB Product creation error:', err.message);
    return res.status(500).json({ error: err.message });
  }

  // Fallback to memory DB
  const newId = "p_" + Date.now();
  const memoryProduct = {
    _id: newId,
    id: newId,
    ...productData,
    category: 'Peripherals' // keep simple fallback tag representation
  };
  memoryProducts.unshift(memoryProduct);
  res.status(201).json(mapProduct(memoryProduct));
});

// UPDATE product details (Admin Only)
router.put('/:id', verifyAdmin, upload.array('images', 5), async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  // Parse arrays/objects from multipart form strings if needed
  if (updateData.specifications && typeof updateData.specifications === 'string') {
    try { updateData.specifications = JSON.parse(updateData.specifications); } catch (_) {}
  }
  if (updateData.variants && typeof updateData.variants === 'string') {
    try { updateData.variants = JSON.parse(updateData.variants); } catch (_) {}
  }
  if (updateData.tags && typeof updateData.tags === 'string') {
    try {
      updateData.tags = JSON.parse(updateData.tags);
    } catch (_) {
      updateData.tags = updateData.tags.split(',').map(t => t.trim());
    }
  }

  if (updateData.price) updateData.price = parseFloat(updateData.price);
  if (updateData.discountPrice) updateData.discountPrice = parseFloat(updateData.discountPrice);
  if (updateData.discountPercentage) updateData.discountPercentage = parseInt(updateData.discountPercentage, 10);
  if (updateData.stock !== undefined) {
    updateData.stock = parseInt(updateData.stock, 10);
    updateData.stockUpdatedAt = new Date();
  }
  if (updateData.featured !== undefined) updateData.featured = updateData.featured === 'true' || updateData.featured === true;
  if (updateData.bestSeller !== undefined) updateData.bestSeller = updateData.bestSeller === 'true' || updateData.bestSeller === true;

  // Handle uploaded files
  if (req.files && req.files.length > 0) {
    const uploadedImages = req.files.map((file, idx) => ({
      url: file.path || `/uploads/${file.filename}`,
      alt: updateData.name || 'Product Image',
      isPrimary: idx === 0
    }));
    updateData.images = uploadedImages;
  }

  try {
    if (isDbConnected()) {
      let updatedProd = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        updatedProd = await Product.findByIdAndUpdate(id, { $set: updateData }, { new: true });
      }
      if (!updatedProd) {
        updatedProd = await Product.findOneAndUpdate({ sku: id }, { $set: updateData }, { new: true });
      }
      if (updatedProd) {
        return res.json(mapProduct(updatedProd));
      }
    }
  } catch (err) {
    console.error('MongoDB Product update error:', err.message);
    return res.status(550).json({ error: err.message });
  }

  // Fallback to memory
  const prodIndex = memoryProducts.findIndex(p => p.id === id || p._id === id);
  if (prodIndex === -1) {
    return res.status(404).json({ error: "Product is missing from catalog." });
  }

  const existing = memoryProducts[prodIndex];
  const updatedProduct = {
    ...existing,
    ...updateData
  };

  memoryProducts[prodIndex] = updatedProduct;
  res.json(mapProduct(updatedProduct));
});

// DELETE product (Admin Only - Soft Delete status update)
router.delete('/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    if (isDbConnected()) {
      let deletedProd = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        deletedProd = await Product.findByIdAndUpdate(id, { $set: { status: 'inactive' } }, { new: true });
      }
      if (!deletedProd) {
        deletedProd = await Product.findOneAndUpdate({ sku: id }, { $set: { status: 'inactive' } }, { new: true });
      }
      if (deletedProd) {
        return res.json({
          success: true,
          message: `Product "${deletedProd.name}" status updated to inactive.`,
          id: id
        });
      }
    }
  } catch (err) {
    console.error('MongoDB Product deletion error:', err.message);
  }

  // Fallback to memory
  const prodIndex = memoryProducts.findIndex(p => p.id === id || p._id === id);
  if (prodIndex === -1) {
    return res.status(404).json({ error: "Product not found." });
  }

  memoryProducts[prodIndex].status = 'inactive';
  res.json({
    success: true,
    message: `Product "${memoryProducts[prodIndex].name}" status updated to inactive in memory.`,
    id: id
  });
});

// ----------------------------------------------------
// RATINGS & REVIEWS STUB (UNLOCKED IN STEP 7)
// ----------------------------------------------------
router.post('/:id/reviews', verifyToken, async (req, res) => {
  res.status(403).json({
    success: false,
    message: "Product reviews and ratings are locked. Eligibility is unlocked in Step 7 after verified purchases are fully tracked."
  });
});

export default router;
