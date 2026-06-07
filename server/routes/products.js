import express from 'express';
import mongoose from 'mongoose';
import { products as memoryProducts } from '../models/memoryDB.js';
import Product from '../models/Product.js';

const router = express.Router();

// Helper to check DB connection and map Mongoose _id to virtual id for frontend compatibility
const isDbConnected = () => mongoose.connection.readyState === 1;

const mapProduct = (p) => {
  if (!p) return null;
  const obj = p.toObject ? p.toObject() : p;
  return {
    ...obj,
    id: obj.id || obj._id.toString()
  };
};

// GET all products
router.get('/', async (req, res) => {
  try {
    if (isDbConnected()) {
      const dbProducts = await Product.find({}).sort({ createdAt: -1 });
      return res.json(dbProducts.map(mapProduct));
    }
  } catch (err) {
    console.error('MongoDB Product fetch error:', err.message);
  }
  // Fallback to memory
  res.json(memoryProducts.map(mapProduct));
});

// GET details of a single product
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isDbConnected()) {
      let prod = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        prod = await Product.findById(id);
      }
      if (!prod) {
        prod = await Product.findOne({ id: id }); // also check key field backup
      }
      if (prod) {
        return res.json(mapProduct(prod));
      }
    }
  } catch (err) {
    console.error('MongoDB Product detail fetch error:', err.message);
  }

  // Fallback to memory
  const prod = memoryProducts.find(p => p.id === id || p._id === id);
  if (!prod) {
    return res.status(404).json({ error: "Catalog product item not found." });
  }
  res.json(mapProduct(prod));
});

// CREATE new product
router.post('/', async (req, res) => {
  const { name, price, category, description, image } = req.body;

  if (!name || isNaN(parseFloat(price))) {
    return res.status(400).json({ error: "Product 'name' and valid numeric 'price' are required." });
  }

  const productData = {
    name: name.trim(),
    price: parseFloat(price),
    category: category || 'Peripherals',
    rating: 5.0,
    reviewsCount: 0,
    description: description || '',
    image: image || 'from-zinc-700 to-zinc-800'
  };

  try {
    if (isDbConnected()) {
      const newProd = new Product(productData);
      await newProd.save();
      return res.status(201).json(mapProduct(newProd));
    }
  } catch (err) {
    console.error('MongoDB Product creation error:', err.message);
  }

  // Fallback to memory DB
  const newId = "p_" + Date.now();
  const memoryProduct = {
    _id: newId,
    id: newId,
    ...productData
  };
  memoryProducts.unshift(memoryProduct);
  res.status(201).json(mapProduct(memoryProduct));
});

// UPDATE product details
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price, category, description, image } = req.body;

  const updateFields = {};
  if (name !== undefined) updateFields.name = name.trim();
  if (price !== undefined) updateFields.price = parseFloat(price);
  if (category !== undefined) updateFields.category = category;
  if (description !== undefined) updateFields.description = description;
  if (image !== undefined) updateFields.image = image;

  try {
    if (isDbConnected()) {
      let updatedProd = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        updatedProd = await Product.findByIdAndUpdate(id, { $set: updateFields }, { new: true });
      }
      if (!updatedProd) {
        updatedProd = await Product.findOneAndUpdate({ id: id }, { $set: updateFields }, { new: true });
      }
      if (updatedProd) {
        return res.json(mapProduct(updatedProd));
      }
    }
  } catch (err) {
    console.error('MongoDB Product update error:', err.message);
  }

  // Fallback to memory
  const prodIndex = memoryProducts.findIndex(p => p.id === id || p._id === id);
  if (prodIndex === -1) {
    return res.status(404).json({ error: "Requested product is missing from catalog directory." });
  }

  const existing = memoryProducts[prodIndex];
  const updatedProduct = {
    ...existing,
    ...updateFields
  };

  memoryProducts[prodIndex] = updatedProduct;
  res.json(mapProduct(updatedProduct));
});

// DELETE product item
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    if (isDbConnected()) {
      let deletedProd = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        deletedProd = await Product.findByIdAndDelete(id);
      }
      if (!deletedProd) {
        deletedProd = await Product.findOneAndDelete({ id: id });
      }
      if (deletedProd) {
        return res.json({
          success: true,
          message: `Product "${deletedProd.name}" removed successfully from MongoDB.`,
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
    return res.status(404).json({ error: "Target delete catalog item not found." });
  }

  const deletedProduct = memoryProducts.splice(prodIndex, 1)[0];
  res.json({
    success: true,
    message: `Product "${deletedProduct.name}" removed successfully from fallback memory.`,
    id: id
  });
});

export default router;
