import { describe, it, expect } from 'vitest';
import {
  emailSchema,
  passwordSchema,
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  resetPasswordConfirmSchema,
} from './auth';

describe('Auth Schemas', () => {
  describe('emailSchema', () => {
    it('should accept valid email addresses', () => {
      // Arrange
      const validEmails = [
        'user@example.com',
        'test.email+tag@domain.co.uk',
        'user123@test-domain.org',
        'test@example.co.uk',
      ];

      // Act & Assert
      validEmails.forEach(email => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(true);
        expect(result.data).toBe(email);
      });
    });

    it('should reject empty string', () => {
      // Arrange & Act
      const result = emailSchema.safeParse('');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Email jest wymagany');
    });

    it('should reject invalid email formats', () => {
      // Arrange
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user.example.com',
        'user@.com',
        'user..user@example.com',
        'a@b.c', // too short domain
      ];

      // Act & Assert
      invalidEmails.forEach(email => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Nieprawidłowy format email');
      });
    });

    it('should reject whitespace-only strings', () => {
      // Arrange & Act
      const result = emailSchema.safeParse('   ');

      // Assert - Zod checks min length first, so whitespace string fails email validation
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Nieprawidłowy format email');
    });

    it('should reject null and undefined', () => {
      // Arrange & Act & Assert
      expect(emailSchema.safeParse(null).success).toBe(false);
      expect(emailSchema.safeParse(undefined).success).toBe(false);
    });

    it('should reject non-string values', () => {
      // Arrange & Act & Assert
      expect(emailSchema.safeParse(123).success).toBe(false);
      expect(emailSchema.safeParse({}).success).toBe(false);
      expect(emailSchema.safeParse([]).success).toBe(false);
    });
  });

  describe('passwordSchema', () => {
    it('should accept passwords with 8 or more characters', () => {
      // Arrange
      const validPasswords = [
        'password123',
        '12345678',
        'a'.repeat(8),
        'a'.repeat(100),
      ];

      // Act & Assert
      validPasswords.forEach(password => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(true);
        expect(result.data).toBe(password);
      });
    });

    it('should reject passwords shorter than 8 characters', () => {
      // Arrange
      const shortPasswords = [
        '',
        'a',
        '123',
        'abcdefg', // 7 characters
      ];

      // Act & Assert
      shortPasswords.forEach(password => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(false);
        expect(result.error?.issues[0].message).toBe('Hasło musi mieć minimum 8 znaków');
      });
    });

    it('should accept exactly 8 characters', () => {
      // Arrange & Act
      const result = passwordSchema.safeParse('12345678');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe('12345678');
    });

    it('should accept passwords with special characters and spaces', () => {
      // Arrange
      const complexPasswords = [
        'password with spaces',
        'P@ssw0rd!',
        '12345678!@#$%^&*()',
      ];

      // Act & Assert
      complexPasswords.forEach(password => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(true);
      });
    });

    it('should reject null and undefined', () => {
      // Arrange & Act & Assert
      expect(passwordSchema.safeParse(null).success).toBe(false);
      expect(passwordSchema.safeParse(undefined).success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('should accept valid registration data', () => {
      // Arrange
      const validData = {
        email: 'user@example.com',
        password: 'password123',
      };

      // Act
      const result = registerSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should reject invalid email in registration', () => {
      // Arrange
      const invalidData = {
        email: 'notanemail',
        password: 'password123',
      };

      // Act
      const result = registerSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.issues).toHaveLength(1);
      expect(result.error?.issues[0].path).toEqual(['email']);
    });

    it('should reject short password in registration', () => {
      // Arrange
      const invalidData = {
        email: 'user@example.com',
        password: 'short',
      };

      // Act
      const result = registerSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.issues).toHaveLength(1);
      expect(result.error?.issues[0].path).toEqual(['password']);
    });

    it('should reject missing email field', () => {
      // Arrange
      const invalidData = {
        password: 'password123',
      };

      // Act
      const result = registerSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Required');
    });

    it('should reject missing password field', () => {
      // Arrange
      const invalidData = {
        email: 'user@example.com',
      };

      // Act
      const result = registerSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Required');
    });

    it('should reject both invalid fields', () => {
      // Arrange
      const invalidData = {
        email: 'notanemail',
        password: 'short',
      };

      // Act
      const result = registerSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.issues).toHaveLength(2);
    });
  });

  describe('loginSchema', () => {
    it('should accept valid login data', () => {
      // Arrange
      const validData = {
        email: 'user@example.com',
        password: 'password123',
      };

      // Act
      const result = loginSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should accept any non-empty password for login', () => {
      // Arrange
      const validData = {
        email: 'user@example.com',
        password: 'a', // Minimum 1 character, unlike register
      };

      // Act
      const result = loginSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should reject empty password for login', () => {
      // Arrange
      const invalidData = {
        email: 'user@example.com',
        password: '',
      };

      // Act
      const result = loginSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Hasło jest wymagane');
    });

    it('should reject invalid email in login', () => {
      // Arrange
      const invalidData = {
        email: 'notanemail',
        password: 'password123',
      };

      // Act
      const result = loginSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['email']);
    });
  });

  describe('resetPasswordSchema', () => {
    it('should accept valid email for password reset', () => {
      // Arrange
      const validData = {
        email: 'user@example.com',
      };

      // Act
      const result = resetPasswordSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should reject invalid email for password reset', () => {
      // Arrange
      const invalidData = {
        email: 'notanemail',
      };

      // Act
      const result = resetPasswordSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['email']);
    });

    it('should reject missing email field', () => {
      // Arrange
      const invalidData = {};

      // Act
      const result = resetPasswordSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Required');
    });
  });

  describe('resetPasswordConfirmSchema', () => {
    it('should accept valid password reset confirmation data', () => {
      // Arrange
      const validData = {
        accessToken: 'valid-token-123',
        newPassword: 'newpassword123',
      };

      // Act
      const result = resetPasswordConfirmSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
    });

    it('should reject empty access token', () => {
      // Arrange
      const invalidData = {
        accessToken: '',
        newPassword: 'newpassword123',
      };

      // Act
      const result = resetPasswordConfirmSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Token jest wymagany');
    });

    it('should reject short new password', () => {
      // Arrange
      const invalidData = {
        accessToken: 'valid-token-123',
        newPassword: 'short',
      };

      // Act
      const result = resetPasswordConfirmSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Hasło musi mieć minimum 8 znaków');
    });

    it('should reject missing fields', () => {
      // Arrange
      const invalidData1 = { accessToken: 'token' };
      const invalidData2 = { newPassword: 'password123' };
      const invalidData3 = {};

      // Act & Assert
      expect(resetPasswordConfirmSchema.safeParse(invalidData1).success).toBe(false);
      expect(resetPasswordConfirmSchema.safeParse(invalidData2).success).toBe(false);
      expect(resetPasswordConfirmSchema.safeParse(invalidData3).success).toBe(false);
    });
  });

  describe('business rules validation', () => {
    describe('password requirements', () => {
      it('should enforce minimum 8 characters for registration', () => {
        // Arrange - Test various password lengths
        const testCases = [
          { password: '1234567', shouldPass: false }, // 7 chars - fail
          { password: '12345678', shouldPass: true },  // 8 chars - pass
          { password: '123456789', shouldPass: true }, // 9 chars - pass
        ];

        // Act & Assert
        testCases.forEach(({ password, shouldPass }) => {
          const result = passwordSchema.safeParse(password);
          expect(result.success).toBe(shouldPass);
        });
      });

      it('should allow login with any password length >= 1', () => {
        // Arrange - Test that login allows shorter passwords than registration
        const testCases = [
          { password: '', shouldPass: false }, // 0 chars - fail
          { password: 'a', shouldPass: true },  // 1 char - pass
          { password: '1234567', shouldPass: true }, // 7 chars - pass
        ];

        // Act & Assert
        testCases.forEach(({ password, shouldPass }) => {
          const loginData = { email: 'user@example.com', password };
          const result = loginSchema.safeParse(loginData);
          expect(result.success).toBe(shouldPass);
        });
      });
    });

    describe('email format validation', () => {
      it('should accept common email formats', () => {
        // Arrange
        const commonEmails = [
          'user@gmail.com',
          'test.email+tag@domain.com',
          'user@test-domain.co.uk',
          '123@test.com',
        ];

        // Act & Assert
        commonEmails.forEach(email => {
          expect(emailSchema.safeParse(email).success).toBe(true);
        });
      });

      it('should reject common invalid formats', () => {
        // Arrange
        const invalidEmails = [
          'user@.com',
          'user..user@example.com',
          '@example.com',
          'user@',
          'user.example.com',
          'user@exam ple.com', // space in domain
        ];

        // Act & Assert
        invalidEmails.forEach(email => {
          expect(emailSchema.safeParse(email).success).toBe(false);
        });
      });
    });
  });
});