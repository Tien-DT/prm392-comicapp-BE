import { Response } from 'express';
import * as userService from '../services/user.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getCurrentUser = (req: AuthRequest, res: Response) => {
  // The user object is already attached to the request by the 'protect' middleware
  // No need to call the service again
  res.status(200).json(req.user);
};

export const updateCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { username, avatar } = req.body;

    const updatedUser = await userService.updateUser(userId, { username, avatar });
    res.status(200).json(updatedUser);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};
