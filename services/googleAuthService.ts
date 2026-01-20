import { prisma } from '../lib/prisma';
import axios from 'axios';

export async function verifyGoogleToken(token: string) {
    try {
        const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
        const payload = response.data;

        if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
            throw new Error('Invalid token audience');
        }

        return payload; // contains email, name, sub (google id), picture
    } catch (error: any) {
        throw new Error('Invalid Google token: ' + error.message);
    }
}

export async function findOrCreateGoogleUser(googleProfile: any) {
    const { email, name, picture, sub } = googleProfile;

    let user = await prisma.user.findUnique({
        where: { email }
    });

    if (user) {
        // Link google ID if not linked
        if (!user.googleId) {
            user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId: sub, image: user.image || picture }
            });
        }
    } else {
        // Create new user
        user = await prisma.user.create({
            data: {
                email,
                name,
                googleId: sub,
                image: picture,
                emailVerified: true // Google emails are verified
            }
        });
    }

    return user;
}
