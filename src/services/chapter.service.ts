import prisma from '../lib/prisma';
import { supabase } from '../lib/supabase';

interface CreateChapterData {
  comicId: string;
  title: string;
  chapterNumber: number;
  file: Express.Multer.File;
}

const CHAPTERS_BUCKET = 'comic-chapters';

export const getChaptersForComic = async (comicId: string) => {
  const chapters = await prisma.chapter.findMany({
    where: { comicId },
    orderBy: { chapterNumber: 'asc' },
    select: {
      id: true,
      title: true,
      chapterNumber: true,
      pdfUrl: true,
      createdAt: true,
    },
  });
  return chapters;
};

export const createChapter = async (data: CreateChapterData) => {
  const { comicId, title, chapterNumber, file } = data;

  // 1. Upload PDF to Supabase Storage
  const fileExtension = file.originalname.split('.').pop();
  const fileName = `${comicId}-${Date.now()}.${fileExtension}`;
  const filePath = `${comicId}/${fileName}`;

  let uploadedFilePath: string | null = null;

  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(CHAPTERS_BUCKET)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw new Error(`Supabase upload error: ${uploadError.message}`);
    }

    uploadedFilePath = filePath;
    console.log('File uploaded successfully:', uploadData);
  } catch (error: any) {
    console.error('Upload failed with exception:', error);
    throw new Error(`Supabase upload error: ${error.message}`);
  }

  // 2. Get public URL of the uploaded file
  const { data: urlData } = supabase.storage
    .from(CHAPTERS_BUCKET)
    .getPublicUrl(filePath);

  if (!urlData || !urlData.publicUrl) {
    // Rollback: delete uploaded file
    if (uploadedFilePath) {
      await supabase.storage.from(CHAPTERS_BUCKET).remove([uploadedFilePath]);
    }
    throw new Error('Could not get public URL for the uploaded file.');
  }

  const pdfUrl = urlData.publicUrl;

  // 3. Create chapter record in the database and update the comic's updatedAt timestamp
  try {
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
  } catch (dbError: any) {
    // Rollback: delete uploaded file if DB transaction fails
    console.error('Database transaction failed:', dbError);
    if (uploadedFilePath) {
      console.log('Rolling back uploaded file...');
      await supabase.storage.from(CHAPTERS_BUCKET).remove([uploadedFilePath]);
    }
    throw new Error(`Failed to create chapter: ${dbError.message}`);
  }
};

export const updateChapter = async (
  chapterId: string,
  comicId: string,
  data: { title?: string; chapterNumber?: number },
  file?: Express.Multer.File
) => {
  const existing = await prisma.chapter.findFirst({
    where: { id: chapterId, comicId },
    select: { id: true, pdfUrl: true },
  });

  if (!existing) {
    throw new Error('Chapter not found for this comic');
  }

  let newPdfUrl: string | undefined;
  let uploadedFilePath: string | null = null;

  if (file) {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${comicId}-${Date.now()}.${fileExtension}`;
    const filePath = `${comicId}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(CHAPTERS_BUCKET)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw new Error(`Supabase upload error: ${uploadError.message}`);
      }

      uploadedFilePath = filePath;

      const { data: urlData } = supabase.storage
        .from(CHAPTERS_BUCKET)
        .getPublicUrl(filePath);

      if (!urlData || !urlData.publicUrl) {
        throw new Error('Could not get public URL for the uploaded file.');
      }

      newPdfUrl = urlData.publicUrl;
    } catch (error: any) {
      if (uploadedFilePath) {
        await supabase.storage.from(CHAPTERS_BUCKET).remove([uploadedFilePath]);
      }
      console.error('Update chapter upload error:', error);
      throw new Error(error.message || 'Failed to upload chapter PDF.');
    }
  }

  const updatePayload: { title?: string; chapterNumber?: number; pdfUrl?: string } = {
    ...data,
  };
  if (newPdfUrl) {
    updatePayload.pdfUrl = newPdfUrl;
  }

  try {
    const [updatedChapter] = await prisma.$transaction([
      prisma.chapter.update({
        where: { id: chapterId },
        data: updatePayload,
      }),
      prisma.comic.update({
        where: { id: comicId },
        data: { updatedAt: new Date() },
      }),
    ]);

    if (newPdfUrl && existing.pdfUrl) {
      try {
        const url = new URL(existing.pdfUrl);
        const pathMatch = url.pathname.match(new RegExp(`/object/public/${CHAPTERS_BUCKET}/(.+)$`));
        if (pathMatch && pathMatch[1]) {
          await supabase.storage.from(CHAPTERS_BUCKET).remove([pathMatch[1]]);
        }
      } catch (cleanupError) {
        console.warn('Failed to delete old chapter PDF:', cleanupError);
      }
    }

    return updatedChapter;
  } catch (error: any) {
    if (newPdfUrl && uploadedFilePath) {
      await supabase.storage.from(CHAPTERS_BUCKET).remove([uploadedFilePath]);
    }
    throw error;
  }
};

export const deleteChapter = async (chapterId: string, comicId: string) => {
  // 1. Get chapter details to find the file path in Supabase
  const chapter = await prisma.chapter.findFirst({
    where: { id: chapterId, comicId },
    select: { pdfUrl: true },
  });

  if (!chapter) {
    throw new Error('Chapter not found for this comic');
  }

  if (chapter && chapter.pdfUrl) {
    // 2. Delete the file from Supabase Storage
    try {
      // Extract file path from URL: https://xxx.supabase.co/storage/v1/object/public/comic-chapters/comicId/file.pdf
      const url = new URL(chapter.pdfUrl);
      const pathMatch = url.pathname.match(new RegExp(`/object/public/${CHAPTERS_BUCKET}/(.+)$`));
      
      if (pathMatch && pathMatch[1]) {
        const filePath = pathMatch[1];
        const { error: deleteError } = await supabase.storage.from(CHAPTERS_BUCKET).remove([filePath]);
        if (deleteError) {
          // Log the error but don't block DB deletion if the file is already gone
          console.error(`Supabase delete error: ${deleteError.message}`);
        }
      } else {
        console.warn(`Could not parse file path from URL: ${chapter.pdfUrl}`);
      }
    } catch (error) {
      console.error(`Error parsing PDF URL for deletion:`, error);
    }
  }

  // 3. Delete the chapter from the database
  await prisma.$transaction([
    prisma.chapter.delete({ where: { id: chapterId } }),
    prisma.comic.update({
      where: { id: comicId },
      data: { updatedAt: new Date() },
    }),
  ]);
};
