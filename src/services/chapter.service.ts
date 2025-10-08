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

export const updateChapter = async (chapterId: string, data: { title?: string; chapterNumber?: number }) => {
  const updatedChapter = await prisma.chapter.update({
    where: { id: chapterId },
    data,
  });
  return updatedChapter;
};

export const deleteChapter = async (chapterId: string) => {
  // 1. Get chapter details to find the file path in Supabase
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { pdfUrl: true },
  });

  if (chapter && chapter.pdfUrl) {
    // 2. Delete the file from Supabase Storage
    const filePath = chapter.pdfUrl.substring(chapter.pdfUrl.indexOf(CHAPTERS_BUCKET));
    const { error: deleteError } = await supabase.storage.from(CHAPTERS_BUCKET).remove([filePath]);
    if (deleteError) {
      // Log the error but don't block DB deletion if the file is already gone
      console.error(`Supabase delete error: ${deleteError.message}`);
    }
  }

  // 3. Delete the chapter from the database
  await prisma.chapter.delete({ where: { id: chapterId } });
};
