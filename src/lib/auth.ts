/**
 * Authentication Utilities
 * Password hashing and session management
 */

import { compare, hash } from 'bcryptjs';
import { prisma } from './prisma';

const SALT_ROUNDS = 10;

/**
 * Hash password
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, SALT_ROUNDS);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await compare(password, hashedPassword);
}

/**
 * Create new user
 */
export async function createUser(email: string, password: string, name?: string) {
  const hashedPassword = await hashPassword(password);

  return await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  });
}

/**
 * Find user by email
 */
export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
  });
}

/**
 * Authenticate user
 */
export async function authenticateUser(email: string, password: string) {
  const user = await getUserByEmail(email);

  if (!user) {
    return null;
  }

  const isValid = await verifyPassword(password, user.password);

  if (!isValid) {
    return null;
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
