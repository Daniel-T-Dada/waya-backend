import dotenv from 'dotenv';
dotenv.config();

import cloudinary from '../config/cloudinary';

async function testCloudinary() {
    console.log('Testing Cloudinary connection...');
    console.log(`Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);

    try {
        const result = await cloudinary.api.ping();
        console.log('Cloudinary connection successful:', result);
    } catch (error) {
        console.error('Cloudinary connection failed:', error);
    }
}

testCloudinary();
