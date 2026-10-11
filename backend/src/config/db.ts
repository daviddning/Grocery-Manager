import mongoose from 'mongoose'

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/kitchenhub'

export async function connectDB(uri: string = process.env.MONGODB_URI || DEFAULT_URI) {
  try {
    await mongoose.connect(uri)
    console.log('MongoDB connected')
  } catch (error) {
    console.error('DB connection failed:', error)
    process.exit(1)
  }
}
