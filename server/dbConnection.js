import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import { products as defaultProducts } from './models/memoryDB.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexus';

export let isDbConnected = false;

export async function connectDB() {
  try {
    console.log('Attempting connection to MongoDB...', MONGODB_URI.replace(/:([^:@]+)@/, ':****@'));
    await mongoose.connect(MONGODB_URI);
    isDbConnected = true;
    console.log('🎉 MongoDB connected successfully.');

    // Auto-seed default products if the database is clean
    try {
      const count = await Product.countDocuments();
      if (count === 0) {
        console.log('📦 Database is empty. Seeding standard curated catalog products...');
        
        // Remove simulated custom ID so mongo generates native ObjectIds but also keep backward-compatible lookup
        const productsToSeed = defaultProducts.map(({ id, _id, ...rest }) => ({
          ...rest
        }));

        await Product.insertMany(productsToSeed);
        console.log('✅ Catalog seeded successfully.');
      }
    } catch (seedErr) {
      console.error('⚠️ Seeding warning:', seedErr.message);
    }

  } catch (err) {
    isDbConnected = false;
    console.error('❌ MongoDB Connection failed:', err.message);
    console.log('🔌 Standing by in simulated local memoryDB fallback mode.');
  }
}
