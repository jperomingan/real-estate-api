import 'dotenv/config';

export const env = {
    PORT: Number(process.env.PORT || 4000),
    DATABASE_URL: process.env.DATABASE_URL || '',
    JWT_SECRET: process.env.JWT_SECRET || '',
};

if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing');
}

if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing');
}