-- Add CASCADE delete to all Comic foreign key constraints

-- CategoryOnComic: CASCADE delete when Comic is deleted
ALTER TABLE "CategoryOnComic" 
DROP CONSTRAINT IF EXISTS "CategoryOnComic_comicId_fkey",
ADD CONSTRAINT "CategoryOnComic_comicId_fkey" 
  FOREIGN KEY ("comicId") REFERENCES "Comic"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Chapter: CASCADE delete when Comic is deleted
ALTER TABLE "Chapter" 
DROP CONSTRAINT IF EXISTS "Chapter_comicId_fkey",
ADD CONSTRAINT "Chapter_comicId_fkey" 
  FOREIGN KEY ("comicId") REFERENCES "Comic"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Review: CASCADE delete when Comic is deleted
ALTER TABLE "Review" 
DROP CONSTRAINT IF EXISTS "Review_comicId_fkey",
ADD CONSTRAINT "Review_comicId_fkey" 
  FOREIGN KEY ("comicId") REFERENCES "Comic"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- UserComicLibrary: CASCADE delete when Comic is deleted
ALTER TABLE "UserComicLibrary" 
DROP CONSTRAINT IF EXISTS "UserComicLibrary_comicId_fkey",
ADD CONSTRAINT "UserComicLibrary_comicId_fkey" 
  FOREIGN KEY ("comicId") REFERENCES "Comic"("id") 
  ON DELETE CASCADE ON UPDATE CASCADE;
