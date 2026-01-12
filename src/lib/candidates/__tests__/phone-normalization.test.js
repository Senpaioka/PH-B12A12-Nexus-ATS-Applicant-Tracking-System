/**
 * Property Tests for Phone Number Normalization
 * Tests the universal correctness properties of phone number normalization
 */

import fc from 'fast-check';
import { normalizePhoneNumber } from '../candidate-validation.js';

describe('Phone Number Normalization Property Tests', () => {
  /**
   * Property 12: Phone number normalization
   * Validates: Requirements 6.4
   * 
   * Properties tested:
   * - Normalization is idempotent (normalizing twice gives same result)
   * - Valid phone numbers maintain their validity after normalization
   * - Normalized format is consistent (starts with + and contains only digits)
   * - US numbers are properly formatted with +1 prefix
   * - International numbers preserve their country codes
   */
  
  describe('Property 12: Phone number normalization consistency', () => {
    test('normalization is idempotent', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /[\d+\-\s\(\)\.]+/.test(s)),
        (phoneInput) => {
          const normalized1 = normalizePhoneNumber(phoneInput);
          const normalized2 = normalizePhoneNumber(normalized1);
          
          // Normalizing twice should give the same result
          expect(normalized2).toBe(normalized1);
        }
      ), { numRuns: 100 });
    });

    test('US phone numbers get +1 prefix', () => {
      fc.assert(fc.property(
        fc.integer({ min: 2000000000, max: 9999999999 }),
        (phoneNumber) => {
          const phoneStr = phoneNumber.toString();
          const normalized = normalizePhoneNumber(phoneStr);
          
          // 10-digit US numbers should get +1 prefix
          if (phoneStr.length === 10) {
            expect(normalized).toBe(`+1${phoneStr}`);
          }
        }
      ), { numRuns: 100 });
    });

    test('11-digit numbers starting with 1 get + prefix', () => {
      fc.assert(fc.property(
        fc.integer({ min: 10000000000, max: 19999999999 }),
        (phoneNumber) => {
          const phoneStr = phoneNumber.toString();
          const normalized = normalizePhoneNumber(phoneStr);
          
          // 11-digit numbers starting with 1 should get + prefix
          if (phoneStr.startsWith('1') && phoneStr.length === 11) {
            expect(normalized).toBe(`+${phoneStr}`);
          }
        }
      ), { numRuns: 100 });
    });

    test('numbers with +1 prefix are preserved', () => {
      fc.assert(fc.property(
        fc.integer({ min: 2000000000, max: 9999999999 }),
        (phoneNumber) => {
          const phoneStr = `+1${phoneNumber}`;
          const normalized = normalizePhoneNumber(phoneStr);
          
          // Numbers already with +1 should be preserved
          expect(normalized).toBe(phoneStr);
        }
      ), { numRuns: 100 });
    });

    test('normalized format contains only digits and plus', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => /[\d+\-\s\(\)\.]+/.test(s)),
        (phoneInput) => {
          const normalized = normalizePhoneNumber(phoneInput);
          
          // Normalized phone should only contain digits and optionally start with +
          if (normalized.length > 0) {
            expect(normalized).toMatch(/^\+?\d+$/);
          }
        }
      ), { numRuns: 100 });
    });

    test('formatting characters are removed', () => {
      fc.assert(fc.property(
        fc.record({
          digits: fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 10, maxLength: 15 }),
          separators: fc.array(fc.constantFrom('-', ' ', '(', ')', '.'), { maxLength: 5 })
        }),
        ({ digits, separators }) => {
          // Create a phone number with formatting characters
          const digitStr = digits.join('');
          const formatted = digitStr.split('').join(separators[0] || '');
          const normalized = normalizePhoneNumber(formatted);
          
          // All formatting should be removed
          expect(normalized).not.toMatch(/[-\s\(\)\.]/);
          
          // Should contain digits (possibly with + prefix)
          if (normalized.length > 0) {
            expect(normalized).toMatch(/^\+?\d+$/);
            
            // For US numbers, check the logic
            if (digitStr.length === 10) {
              expect(normalized).toBe(`+1${digitStr}`);
            } else if (digitStr.startsWith('1') && digitStr.length === 11) {
              expect(normalized).toBe(`+${digitStr}`);
            }
          }
        }
      ), { numRuns: 100 });
    });

    test('empty and invalid inputs return empty string', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.constant(''),
          fc.constant(null),
          fc.constant(undefined),
          fc.string().filter(s => !/\d/.test(s)) // strings with no digits
        ),
        (invalidInput) => {
          const normalized = normalizePhoneNumber(invalidInput);
          expect(normalized).toBe('');
        }
      ), { numRuns: 50 });
    });

    test('international numbers preserve country codes', () => {
      fc.assert(fc.property(
        fc.record({
          countryCode: fc.integer({ min: 2, max: 999 }),
          number: fc.integer({ min: 1000000, max: 999999999999 })
        }),
        ({ countryCode, number }) => {
          const phoneStr = `+${countryCode}${number}`;
          const normalized = normalizePhoneNumber(phoneStr);
          
          // International numbers should preserve their format
          expect(normalized).toBe(phoneStr);
        }
      ), { numRuns: 100 });
    });
  });

  describe('Edge cases and specific formats', () => {
    test('handles common US phone formats correctly', () => {
      const testCases = [
        { input: '(555) 123-4567', expected: '+15551234567' },
        { input: '555-123-4567', expected: '+15551234567' },
        { input: '555.123.4567', expected: '+15551234567' },
        { input: '555 123 4567', expected: '+15551234567' },
        { input: '5551234567', expected: '+15551234567' },
        { input: '1-555-123-4567', expected: '+15551234567' },
        { input: '+1-555-123-4567', expected: '+15551234567' },
        { input: '+1 (555) 123-4567', expected: '+15551234567' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(normalizePhoneNumber(input)).toBe(expected);
      });
    });

    test('handles international formats correctly', () => {
      const testCases = [
        { input: '+44 20 7946 0958', expected: '+442079460958' },
        { input: '+33 1 42 86 83 26', expected: '+33142868326' },
        { input: '+49 30 12345678', expected: '+493012345678' },
        { input: '+86 138 0013 8000', expected: '+8613800138000' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(normalizePhoneNumber(input)).toBe(expected);
      });
    });

    test('handles edge cases correctly', () => {
      const testCases = [
        { input: '', expected: '' },
        { input: null, expected: '' },
        { input: undefined, expected: '' },
        { input: 'abc', expected: '' },
        { input: '123', expected: '123' },
        { input: '+', expected: '' },
        { input: '++1234', expected: '+1234' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(normalizePhoneNumber(input)).toBe(expected);
      });
    });
  });

  describe('Integration with validation', () => {
    test('normalized phone numbers pass validation regex', () => {
      fc.assert(fc.property(
        fc.oneof(
          // US phone numbers
          fc.integer({ min: 2000000000, max: 9999999999 }).map(n => n.toString()),
          // International phone numbers
          fc.record({
            countryCode: fc.integer({ min: 2, max: 999 }),
            number: fc.integer({ min: 1000000, max: 999999999999 })
          }).map(({ countryCode, number }) => `+${countryCode}${number}`)
        ),
        (phoneInput) => {
          const normalized = normalizePhoneNumber(phoneInput);
          
          if (normalized.length > 0) {
            // Should match the validation regex pattern
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            expect(normalized).toMatch(phoneRegex);
          }
        }
      ), { numRuns: 100 });
    });
  });
});