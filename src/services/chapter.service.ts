import prisma from '../lib/prisma';
import { supabase } from '../lib/supabase';

interface CreateChapterData {
  comicId: string;
  title: string;
  chapterNumber: number;
  file: Express.Multer.File;
}

const CHAPTERS_BUCKET = 'comic-chapters';

export const createChapter = async (data: CreateChapterData) => {
  const { comicId, title, chapterNumber, file } = data;

  // 1. Upload PDF to Supabase Storage
  const fileExtension = file.originalname.split('.').pop();
  const fileName = `${comicId}-${Date.now()}.${fileExtension}`;
  const filePath = `${comicId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(CHAPTERS_BUCKET)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Supabase upload error: ${uploadError.message}`);
  }

  // 2. Get public URL of the uploaded file
  const { data: urlData } = supabase.storage
    .from(CHAPTERS_BUCKET)
    .getPublicUrl(filePath);

  if (!urlData || !urlData.publicUrl) {
    throw new Error('Could not get public URL for the uploaded file.');
  }

  const pdfUrl = urlData.publicUrl;

  // 3. Create chapter record in the database and update the comic's updatedAt timestamp
  const [, newChapter] = await prisma.$transaction([
    prisma.comic.update({
      where: { id: comicId },
      data: { updatedAt: new Date() },
    }),
    prisma.chapter.create({
      data: {
        title,
        chapterNumber,
        pdfUrl,
        comic: {
          connect: { id: comicId },
        },
      },
    }),
  ]);

  return newChapter;
};
