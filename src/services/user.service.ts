import prisma from '../lib/prisma';
import { supabase } from '../lib/supabase';

const AVATAR_BUCKET = 'user-avatars';

export const getUserById = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
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

export const updateUser = async (
  userId: string,
  data: UpdateUserData,
  avatarFile?: Express.Multer.File
) => {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatar: true },
  });

  if (!existing) {
    throw new Error('User not found');
  }

  let newAvatarUrl: string | undefined;
  let uploadedPath: string | null = null;

  if (avatarFile) {
    const extension = avatarFile.originalname.split('.').pop() || 'jpg';
    const fileName = `${userId}-${Date.now()}.${extension}`;
    const filePath = `${userId}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(filePath, avatarFile.buffer, {
          contentType: avatarFile.mimetype,
          upsert: false,
        });

      if (uploadError) {
        console.error('Supabase avatar upload error:', uploadError);
        throw new Error(`Supabase upload error: ${uploadError.message}`);
      }

      uploadedPath = filePath;
      const { data: urlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);
      if (!urlData || !urlData.publicUrl) {
        throw new Error('Could not get public URL for avatar.');
      }
      newAvatarUrl = urlData.publicUrl;
    } catch (error: any) {
      if (uploadedPath) {
        await supabase.storage.from(AVATAR_BUCKET).remove([uploadedPath]);
      }
      throw new Error(error.message || 'Failed to upload avatar.');
    }
  }

  const updatePayload: UpdateUserData = {
    ...data,
  };

  if (newAvatarUrl) {
    updatePayload.avatar = newAvatarUrl;
  }

  if (updatePayload.username) {
    updatePayload.username = updatePayload.username.trim();
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updatePayload,
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (newAvatarUrl && existing.avatar) {
      try {
        const url = new URL(existing.avatar);
        const match = url.pathname.match(new RegExp(`/object/public/${AVATAR_BUCKET}/(.+)$`));
        if (match && match[1]) {
          await supabase.storage.from(AVATAR_BUCKET).remove([match[1]]);
        }
      } catch (cleanupError) {
        console.warn('Failed to remove old avatar:', cleanupError);
      }
    }

    return updatedUser;
  } catch (error) {
    if (newAvatarUrl && uploadedPath) {
      await supabase.storage.from(AVATAR_BUCKET).remove([uploadedPath]);
    }
    throw error;
  }
};
