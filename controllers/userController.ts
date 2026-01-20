import { Request, Response } from 'express';
import * as userService from '../services/userService';
import * as cloudinaryService from '../services/cloudinaryService';
import { UploadApiResponse } from 'cloudinary';

export async function getProfile(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const user = await userService.getUserProfile(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        return res.json(user);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
}

export async function updateProfile(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { name, phoneNumber, image, notificationPreferences } = req.body;

        const updatedUser = await userService.updateUserProfile(userId, {
            name,
            phoneNumber,
            image,
            notificationPreferences
        });

        return res.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}
export async function updateProfileImage(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { profileImagePublicId } = req.body;

        if (!profileImagePublicId) {
            return res.status(400).json({ error: 'profileImagePublicId is required' });
        }

        // Ideally verify that the public_id exists in Cloudinary here
        const imageUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${profileImagePublicId}`;

        const updated = await userService.updateProfileImage(userId, imageUrl, profileImagePublicId);
        return res.json({ message: 'Profile image updated', user: updated });
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}

export async function uploadProfileImage(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const result: UploadApiResponse = await cloudinaryService.uploadFromBuffer((req as any).file.buffer);
        const updated = await userService.updateProfileImage(userId, result.secure_url, result.public_id);

        return res.json({ message: 'Profile image uploaded and updated', user: updated });
    } catch (err: any) {
        return res.status(400).json({ error: err.message });
    }
}
