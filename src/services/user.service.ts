import prisma from '../lib/prisma';

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { // Explicitly select fields to omit password
      id: true,
      email: true,
      username: true,
      avatar: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return user;
};

interface UpdateUserData {
  username?: string;
  avatar?: string;
}

export const updateUser = async (userId: string, data: UpdateUserData) => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data,
    select: { // Return the updated user without the password
      id: true,
      email: true,
      username: true,
      avatar: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return updatedUser;
};
