import mongoose from 'mongoose'

export async function connectDB() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/kitchenhub')
    console.log('MongoDB connected')
  } catch (error) {
    console.error('DB connection failed:', error)
    process.exit(1)
  }
}