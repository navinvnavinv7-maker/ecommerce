import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import Category from './models/Category.js';
import { products as defaultProducts, categories as defaultCategories } from './models/memoryDB.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexus';

export let isDbConnected = false;

export async function connectDB() {
  try {
    console.log('Attempting connection to MongoDB...', MONGODB_URI.replace(/:([^:@]+)@/, ':****@'));
    await mongoose.connect(MONGODB_URI);
    isDbConnected = true;
    console.log('🎉 MongoDB connected successfully.');

    // Auto-seed default categories and products if the database is clean
    try {
      const categoryCount = await Category.countDocuments();
      if (categoryCount === 0) {
        const categoriesToSeed = defaultCategories.map(({ _id, ...rest }) => ({ ...rest }));
        await Category.insertMany(categoriesToSeed);
        console.log('✅ Category catalog seeded successfully.');
      }

      const productCount = await Product.countDocuments();
      if (productCount === 0) {
        console.log('📦 Database is empty. Seeding standard curated catalog products...');
        
        const seededCategories = await Category.find({}).lean();
        const categoryIdByName = new Map(seededCategories.map(cat => [cat.name.toLowerCase(), cat._id]));

        // Remove simulated custom ID so mongo generates native ObjectIds but also keep backward-compatible lookup
        const productsToSeed = defaultProducts.map(({ id, _id, category, ...rest }) => {
          const normalizedCategory = category
            ? (mongoose.Types.ObjectId.isValid(category) ? category : categoryIdByName.get(String(category).toLowerCase()) || null)
            : null;

          return {
            ...rest,
            category: normalizedCategory
          };
        });

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
