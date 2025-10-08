import { Router } from 'express';
import multer from 'multer';
import * as chapterController from '../controllers/chapter.controller';
import { protect } from '../middlewares/auth.middleware';
import { isAuthor } from '../middlewares/comic.middleware';

const router = Router({ mergeParams: true }); // mergeParams is important for nested routes

// Configure Multer for in-memory file storage and PDF filter
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'));
    }
  },
});

// The route for creating a chapter
// Middlewares are executed in order: check login -> check authorship -> handle file upload -> run controller
router.post('/', protect, isAuthor, upload.single('chapterPdf'), chapterController.createChapter);

export default router;
