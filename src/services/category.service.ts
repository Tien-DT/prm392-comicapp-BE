import prisma from '../lib/prisma';

export const getAllCategories = async () => {
  const categories = await prisma.category.findMany();
  return categories;
};

export const createCategory = async (name: string) => {
  const existingCategory = await prisma.category.findFirst({
    where: { 
      name: {
        equals: name,
        mode: 'insensitive'
      }
    }
  });

  if (existingCategory) {
    throw new Error('Category already exists');
  }

  const newCategory = await prisma.category.create({
    data: { name },
  });

  return newCategory;
};
