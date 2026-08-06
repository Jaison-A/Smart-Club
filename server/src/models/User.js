const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false, // never returned by default in queries
    },
    role: {
      type: String,
      enum: ['student', 'coordinator', 'admin'],
      default: 'student',
    },
    studentId: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
      min: 1,
      max: 6,
    },
    skills: {
      type: [String],
      default: [],
    },
    interests: {
      type: [String],
      default: [],
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Hashed refresh tokens, not raw ones — if the DB is ever leaked,
    // stored tokens are useless without the original value.
    refreshTokens: {
      type: [String],
      default: [],
      select: false,
    },
  },
  { timestamps: true }
);

// Hash password before saving, but only when it's new or changed —
// otherwise every unrelated update (e.g. editing skills) would re-hash
// the already-hashed password and lock the user out.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare a plaintext candidate against the stored hash.
userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Strip sensitive fields whenever a user document is serialized to JSON
// (e.g. res.json(user)) so they can never accidentally leak in a response.
userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
