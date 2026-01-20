import cloudinary, { cloudinaryConfig } from '../config/cloudinary';
import { UploadApiResponse, UploadApiOptions } from 'cloudinary';

export interface CloudinarySignature {
    cloudName: string;
    apiKey: string;
    timestamp: number;
    signature: string;
    folder: string;
    publicId: string;
}

export function generateSignature(userId: string): CloudinarySignature {
    const timestamp = Math.floor(Date.now() / 1000);
    const prefix = 'user_';
    const publicId = `${prefix}${userId}_${timestamp}`;
    const folder = cloudinaryConfig.folder;

    const signature = cloudinary.utils.api_sign_request(
        {
            timestamp,
            folder,
            public_id: publicId,
        },
        process.env.CLOUDINARY_API_SECRET!
    );

    return {
        cloudName: cloudinaryConfig.cloudName!,
        apiKey: cloudinaryConfig.apiKey!,
        timestamp,
        signature,
        folder,
        publicId
    };
}

export async function uploadFromBuffer(buffer: Buffer, publicId?: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
        const options: UploadApiOptions = {
            folder: cloudinaryConfig.folder,
            resource_type: 'auto',
        };
        if (publicId) options.public_id = publicId;

        const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) reject(error);
            else if (!result) reject(new Error('Cloudinary upload failed with no result'));
            else resolve(result);
        });

        stream.end(buffer);
    });
}

export async function deleteImage(publicId: string): Promise<any> {
    return cloudinary.uploader.destroy(publicId);
}
