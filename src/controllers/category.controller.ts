import { Request, Response } from 'express';
import * as categoryService from '../services/category.service';

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.status(200).json(categories);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const newCategory = await categoryService.createCategory(name);
    res.status(201).json(newCategory);

  } catch (error: any) {
    if (error.message === 'Category already exists') {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};
