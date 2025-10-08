import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ... (existing code)

export const loginWithGoogle = async (idToken: string) => {
  // 1. Verify Google ID token
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();

  if (!payload || !payload.email || !payload.sub) {
    throw new Error('Invalid Google token');
  }

  const { email, name, sub: googleId, picture: avatar } = payload;

  // 2. Upsert user in the database
  let user = await prisma.user.findUnique({
    where: { googleId },
  });

  if (!user) {
    // If no user with this googleId, maybe they registered with email before?
    user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // Link Google account to existing email account
      user = await prisma.user.update({
        where: { email },
        data: { googleId, avatar: user.avatar || avatar },
      });
    } else {
      // Create a brand new user
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          username: name || email.split('@')[0],
          avatar: avatar || null,
        },
      });
    }
  }

  // 3. Generate JWT for the user
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, accessToken };
};

// ... (existing registerUser function)

export const loginUser = async (credentials: Pick<User, 'email' | 'password'>) => {
  const { email, password } = credentials;

  // 1. Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.password) {
    throw new Error('Invalid credentials');
  }

  // 2. Compare passwords
  const isPasswordValid = await bcrypt.compare(password!, user.password);

  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  // 3. Generate JWT
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' } // Token expires in 7 days
  );

  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, accessToken };
};

export const registerUser = async (userData: Omit<User, 'id' | 'avatar' | 'role' | 'googleId' | 'createdAt' | 'updatedAt'>): Promise<Omit<User, 'password'>> => {
  const { email, password, username } = userData;

  // 1. Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('User with this email already exists'); // Will be caught by controller
  }

  // 2. Hash the password
  const hashedPassword = await bcrypt.hash(password!, 10);

  // 3. Create the new user
  const newUser = await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
    },
  });

  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};
