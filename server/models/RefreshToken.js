import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true
  },
  device: {
    type: String,
    default: 'Unknown Device'
  },
  ipAddress: {
    type: String,
    default: 'Unknown IP'
  },
  expiresAt: {
    type: Date,
    required: true
  },
  revoked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for faster lookups and auto-expiry cleanup
refreshTokenSchema.index({ tokenHash: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto-expire document

const RefreshToken = mongoose.models?.RefreshToken || mongoose.model('RefreshToken', refreshTokenSchema);
export default RefreshToken;
