/**
 * Mongoose model for User persistence
 * Minimal implementation: userId, name, email
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: false
});

// Create indexes
// Note: userId already has unique: true (creates index automatically)
UserSchema.index({ email: 1 });
UserSchema.index({ createdAt: -1 });

// Instance method to convert to User object format
UserSchema.methods.toUserObject = function() {
  return {
    userId: this.userId,
    name: this.name,
    email: this.email,
    createdAt: this.createdAt
  };
};

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;

