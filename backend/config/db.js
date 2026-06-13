import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/docq');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Error (MongoDB might not be running): ${error.message}`);
    console.log('Server is running without database connection. Please start MongoDB to use database features.');
  }
};

export default connectDB;
