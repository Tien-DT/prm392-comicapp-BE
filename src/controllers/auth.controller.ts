import { Request, Response } from 'express';
import * as authService from '../services/auth.service';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ message: 'Email, password, and username are required' });
    }

    const newUser = await authService.registerUser({ email, password, username });
    return res.status(201).json(newUser);

  } catch (error: any) {
    if (error.message === 'User with this email already exists') {
      return res.status(409).json({ message: error.message });
    }
    console.error('Registration Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const result = await authService.loginUser({ email, password });
    return res.status(200).json(result);

  } catch (error: any) {
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ message: error.message });
    }
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'Google ID token is required' });
    }

    const result = await authService.loginWithGoogle(idToken);
    return res.status(200).json(result);

  } catch (error: any) {
    console.error('Google Login Error:', error);
    if (error.message === 'Invalid Google token') {
      return res.status(401).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
