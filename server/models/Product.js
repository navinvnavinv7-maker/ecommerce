import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    default: 'Peripherals'
  },
  rating: {
    type: Number,
    default: 5.0
  },
  reviewsCount: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: 'from-zinc-700 to-zinc-800'
  }
}, {
  timestamps: true
});

const Product = mongoose.models?.Product || mongoose.model('Product', productSchema);
export default Product;
