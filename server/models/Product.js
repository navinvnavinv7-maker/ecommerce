import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null // default null to not break existing data immediately
  },
  brand: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discountPrice: {
    type: Number,
    min: 0,
    default: null
  },
  discountPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  stockUpdatedAt: {
    type: Date,
    default: Date.now
  },
  images: [
    {
      url: { type: String, required: true },
      alt: { type: String, default: '' },
      isPrimary: { type: Boolean, default: false }
    }
  ],
  variants: [
    {
      name: { type: String, required: true }, // e.g. "Size", "Color"
      value: { type: String, required: true }, // e.g. "M", "Black"
      sku: { type: String, trim: true },
      price: { type: Number, min: 0 },
      stock: { type: Number, default: 0, min: 0 },
      images: [String] // custom URLs for this variant
    }
  ],
  specifications: {
    type: Map,
    of: String,
    default: {}
  },
  tags: [
    {
      type: String,
      trim: true
    }
  ],
  featured: {
    type: Boolean,
    default: false
  },
  bestSeller: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived'],
    default: 'active'
  },
  metaTitle: {
    type: String,
    trim: true
  },
  metaDescription: {
    type: String,
    trim: true
  },
  ratings: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      value: { type: Number, required: true, min: 1, max: 5 }
    }
  ],
  reviews: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      username: { type: String },
      comment: { type: String, required: true },
      rating: { type: Number, required: true, min: 1, max: 5 },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Auto-generate slug from name on save if not provided
productSchema.pre('save', function(next) {
  if (this.isModified('stock')) {
    this.stockUpdatedAt = new Date();
  }
  
  if (this.name && (!this.slug || this.isModified('name'))) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});


// Virtual for backward-compatibility with existing frontend logic
productSchema.virtual('rating').get(function() {
  if (this.ratings && this.ratings.length > 0) {
    const sum = this.ratings.reduce((acc, r) => acc + r.value, 0);
    return parseFloat((sum / this.ratings.length).toFixed(1));
  }
  return 5.0; // default rating fallback
});

productSchema.virtual('reviewsCount').get(function() {
  return this.reviews ? this.reviews.length : 0;
});

// Virtual for single image string backwards compatibility
productSchema.virtual('image').get(function() {
  if (this.images && this.images.length > 0) {
    const primary = this.images.find(img => img.isPrimary);
    return primary ? primary.url : this.images[0].url;
  }
  return 'from-zinc-700 to-zinc-800'; // Default gradient class / placeholder
});

const Product = mongoose.models?.Product || mongoose.model('Product', productSchema);
export default Product;
