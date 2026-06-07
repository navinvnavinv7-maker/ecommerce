import express from 'express';
import mongoose from 'mongoose';
import { orders as memoryOrders } from '../models/memoryDB.js';
import Order from '../models/Order.js';

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

// GET all orders
router.get('/', async (req, res) => {
  try {
    if (isDbConnected()) {
      const dbOrders = await Order.find({}).sort({ createdAt: -1 });
      return res.json(dbOrders.map(mapOrder));
    }
  } catch (err) {
    console.error('MongoDB orders fetch error:', err.message);
  }

  // Fallback to memory
  res.json(memoryOrders.map(mapOrder));
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

// LODGE / CREATE new purchase order
router.post('/', async (req, res) => {
  const { items, shippingAddress, email, subtotal, total } = req.body;

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
      quantity: item.quantity
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
      const newOrder = new Order(orderData);
      await newOrder.save();
      return res.status(201).json(mapOrder(newOrder));
    }
  } catch (err) {
    console.error('MongoDB Order creation error:', err.message);
  }

  // Fallback to memory DB
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
router.put('/:id', async (req, res) => {
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
router.delete('/:id', async (req, res) => {
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
