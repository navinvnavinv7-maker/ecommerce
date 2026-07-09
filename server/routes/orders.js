import express from 'express';
import mongoose from 'mongoose';
import { orders as memoryOrders, products as memoryProducts } from '../models/memoryDB.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

const isDbConnected = () => mongoose.connection.readyState === 1;

const mapOrder = (o) => {
  if (!o) return null;
  const obj = o.toObject ? o.toObject() : o;
  return {
    ...obj,
    id: obj.id || obj._id.toString(),
    date: obj.createdAt || obj.date || new Date().toISOString()
  };
};

// GET orders
router.get('/', verifyToken, async (req, res) => {
  const { email, role } = req.user;
  try {
    if (isDbConnected()) {
      const query = role === 'admin' ? {} : { email: email.toLowerCase() };
      const dbOrders = await Order.find(query).sort({ createdAt: -1 });
      return res.json(dbOrders.map(mapOrder));
    }
  } catch (err) {
    console.error('MongoDB orders fetch error:', err.message);
  }

  // Fallback to memory
  if (role === 'admin') {
    res.json(memoryOrders.map(mapOrder));
  } else {
    res.json(memoryOrders.filter(o => o.email.toLowerCase() === email.toLowerCase()).map(mapOrder));
  }
});

// GET specific order summary
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isDbConnected()) {
      let ord = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        ord = await Order.findById(id);
      }
      if (!ord) {
        ord = await Order.findOne({ id: id });
      }
      if (ord) {
        return res.json(mapOrder(ord));
      }
    }
  } catch (err) {
    console.error('MongoDB order fetch error:', err.message);
  }

  // Fallback to memory
  const ord = memoryOrders.find(o => o.id === id || o._id === id);
  if (!ord) {
    return res.status(404).json({ error: "Order receipt not found." });
  }
  res.json(mapOrder(ord));
});

// LODGE / CREATE new purchase order (with stock validation & decrement)
router.post('/', verifyToken, async (req, res) => {
  const { items, shippingAddress, subtotal, total } = req.body;
  const email = req.user.email;

  if (!items || !items.length || !shippingAddress || !email) {
    return res.status(400).json({ error: "Cannot place order: missing item listings, shipment details, or contact email." });
  }

  const orderData = {
    customer: shippingAddress.fullName || "Anonymous Member",
    email: email.trim().toLowerCase(),
    items: items.map(item => ({
      id: item.id || item._id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      variantName: item.variantName || null,
      variantValue: item.variantValue || null
    })),
    shippingAddress: {
      fullName: shippingAddress.fullName,
      street: shippingAddress.street,
      city: shippingAddress.city,
      state: shippingAddress.state,
      zipCode: shippingAddress.zipCode,
      country: shippingAddress.country || 'USA'
    },
    subtotal: parseFloat(subtotal) || 0,
    total: parseFloat(total) || 0,
    status: "Pending"
  };

  try {
    if (isDbConnected()) {
      // ── Stock Validation (MongoDB path) ──────────────────────────────
      const stockErrors = [];

      for (const item of items) {
        const productId = item.id || item._id;
        let prod = null;
        if (mongoose.Types.ObjectId.isValid(productId)) {
          prod = await Product.findById(productId);
        }
        if (!prod) {
          prod = await Product.findOne({ $or: [{ sku: productId }, { slug: productId }] });
        }
        if (!prod) {
          stockErrors.push(`Product "${item.name}" not found.`);
          continue;
        }

        // Check variant stock if variant was selected
        if (item.variantName && item.variantValue) {
          const variant = prod.variants.find(
            v => v.name === item.variantName && v.value === item.variantValue
          );
          if (!variant) {
            stockErrors.push(`Variant "${item.variantValue}" for "${item.name}" not found.`);
          } else if (variant.stock < item.quantity) {
            stockErrors.push(`Insufficient stock for "${item.name}" (${item.variantValue}). Available: ${variant.stock}, Requested: ${item.quantity}`);
          }
        } else {
          if (prod.stock < item.quantity) {
            stockErrors.push(`Insufficient stock for "${item.name}". Available: ${prod.stock}, Requested: ${item.quantity}`);
          }
        }
      }

      if (stockErrors.length > 0) {
        return res.status(400).json({ error: "Stock validation failed.", details: stockErrors });
      }

      // ── Decrement Stock After Validation Passes ───────────────────────
      for (const item of items) {
        const productId = item.id || item._id;
        let prod = null;
        if (mongoose.Types.ObjectId.isValid(productId)) {
          prod = await Product.findById(productId);
        }
        if (!prod) {
          prod = await Product.findOne({ $or: [{ sku: productId }, { slug: productId }] });
        }
        if (!prod) continue;

        if (item.variantName && item.variantValue) {
          const varIdx = prod.variants.findIndex(
            v => v.name === item.variantName && v.value === item.variantValue
          );
          if (varIdx !== -1) {
            prod.variants[varIdx].stock = Math.max(0, prod.variants[varIdx].stock - item.quantity);
            prod.markModified('variants');
          }
        } else {
          prod.stock = Math.max(0, prod.stock - item.quantity);
          prod.stockUpdatedAt = new Date();
        }
        await prod.save();
      }

      const newOrder = new Order(orderData);
      await newOrder.save();
      return res.status(201).json(mapOrder(newOrder));
    }
  } catch (err) {
    console.error('MongoDB Order creation error:', err.message);
  }

  // ── Fallback: Memory DB with stock validation & decrement ─────────────
  const memStockErrors = [];
  for (const item of items) {
    const prod = memoryProducts.find(p => p.id === (item.id || item._id) || p._id === (item.id || item._id));
    if (prod && prod.stock !== undefined && prod.stock < item.quantity) {
      memStockErrors.push(`Insufficient stock for "${item.name}". Available: ${prod.stock}, Requested: ${item.quantity}`);
    }
  }
  if (memStockErrors.length > 0) {
    return res.status(400).json({ error: "Stock validation failed.", details: memStockErrors });
  }

  for (const item of items) {
    const prod = memoryProducts.find(p => p.id === (item.id || item._id) || p._id === (item.id || item._id));
    if (prod && prod.stock !== undefined) {
      prod.stock = Math.max(0, prod.stock - item.quantity);
    }
  }

  const generatedId = "ord-" + Math.floor(1000 + Math.random() * 9000);
  const memoryOrder = {
    _id: generatedId,
    id: generatedId,
    date: new Date().toISOString(),
    ...orderData
  };
  memoryOrders.unshift(memoryOrder);
  res.status(201).json(mapOrder(memoryOrder));
});

// UPDATE order fulfillment status
router.put('/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    if (isDbConnected()) {
      let updatedOrd = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        updatedOrd = await Order.findByIdAndUpdate(id, { $set: { status } }, { new: true });
      }
      if (!updatedOrd) {
        updatedOrd = await Order.findOneAndUpdate({ id: id }, { $set: { status } }, { new: true });
      }
      if (updatedOrd) {
        return res.json(mapOrder(updatedOrd));
      }
    }
  } catch (err) {
    console.error('MongoDB Order status update error:', err.message);
  }

  // Fallback to memory
  const ord = memoryOrders.find(o => o.id === id || o._id === id);
  if (!ord) {
    return res.status(404).json({ error: "Fulfillment target order not located." });
  }

  if (status) {
    ord.status = status;
  }
  res.json(mapOrder(ord));
});

// DELETE order
router.delete('/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    if (isDbConnected()) {
      let deletedOrd = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        deletedOrd = await Order.findByIdAndDelete(id);
      }
      if (!deletedOrd) {
        deletedOrd = await Order.findOneAndDelete({ id: id });
      }
      if (deletedOrd) {
        return res.json({
          success: true,
          message: `Order "${id}" removed successfully from MongoDB.`,
          id: id
        });
      }
    }
  } catch (err) {
    console.error('MongoDB Order deletion error:', err.message);
  }

  // Fallback to memory
  const ordIndex = memoryOrders.findIndex(o => o.id === id || o._id === id);
  if (ordIndex === -1) {
    return res.status(404).json({ error: "Target delete order item not found." });
  }

  const deletedOrder = memoryOrders.splice(ordIndex, 1)[0];
  res.json({
    success: true,
    message: `Order "${deletedOrder.id}" removed successfully from fallback memory.`,
    id: id
  });
});

export default router;
