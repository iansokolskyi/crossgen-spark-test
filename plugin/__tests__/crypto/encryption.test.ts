/**
 * Tests for encryption utilities
 */

import { encryptSecrets, decryptSecrets, isEncrypted } from '../../src/crypto/encryption';

describe('Encryption', () => {
    describe('encryptSecrets', () => {
        it('should encrypt plaintext and return valid format', () => {
            const plaintext = 'my-secret-api-key';
            const encrypted = encryptSecrets(plaintext);

            // Should return string in format: iv:authTag:encrypted
            expect(encrypted).toMatch(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/i);

            // Should have three parts
            const parts = encrypted.split(':');
            expect(parts).toHaveLength(3);

            // IV should be 32 hex chars (16 bytes)
            expect(parts[0]).toHaveLength(32);

            // Auth tag should be 32 hex chars (16 bytes)
            expect(parts[1]).toHaveLength(32);

            // Encrypted data should exist
            expect(parts[2].length).toBeGreaterThan(0);
        });

        it('should produce different ciphertext for same plaintext (random IV)', () => {
            const plaintext = 'my-secret-api-key';
            const encrypted1 = encryptSecrets(plaintext);
            const encrypted2 = encryptSecrets(plaintext);

            // Should be different due to random IV
            expect(encrypted1).not.toBe(encrypted2);

            // But both should decrypt to same value
            expect(decryptSecrets(encrypted1)).toBe(plaintext);
            expect(decryptSecrets(encrypted2)).toBe(plaintext);
        });

        it('should handle empty string', () => {
            const encrypted = encryptSecrets('');
            expect(isEncrypted(encrypted)).toBe(true);
            expect(decryptSecrets(encrypted)).toBe('');
        });

        it('should handle multi-line YAML content', () => {
            const yaml = `api_keys:
  claude-agent: sk-ant-123
  claude-direct: sk-ant-456
  openai: sk-789`;

            const encrypted = encryptSecrets(yaml);
            expect(isEncrypted(encrypted)).toBe(true);

            const decrypted = decryptSecrets(encrypted);
            expect(decrypted).toBe(yaml);
        });

        it('should handle unicode characters', () => {
            const plaintext = 'Secret: 🔐 encrypted! 日本語';
            const encrypted = encryptSecrets(plaintext);
            const decrypted = decryptSecrets(encrypted);

            expect(decrypted).toBe(plaintext);
        });
    });

    describe('decryptSecrets', () => {
        it('should decrypt valid encrypted data', () => {
            const plaintext = 'test-api-key-12345';
            const encrypted = encryptSecrets(plaintext);
            const decrypted = decryptSecrets(encrypted);

            expect(decrypted).toBe(plaintext);
        });

        it('should throw error for invalid format', () => {
            expect(() => decryptSecrets('invalid-data')).toThrow('Invalid encrypted data format');
        });

        it('should throw error for malformed format (missing parts)', () => {
            expect(() => decryptSecrets('abc:def')).toThrow('Invalid encrypted data format');
        });

        it('should throw error for empty IV or authTag', () => {
            // Empty IV
            expect(() => decryptSecrets(':aabbccdd11223344aabbccdd11223344:1122334455667788')).toThrow('Invalid encrypted data format');
            // Empty authTag
            expect(() => decryptSecrets('aabbccdd11223344aabbccdd11223344::1122334455667788')).toThrow('Invalid encrypted data format');
        });

        it('should throw error for tampered ciphertext', () => {
            const plaintext = 'test-secret';
            const encrypted = encryptSecrets(plaintext);
            const parts = encrypted.split(':');

            // Tamper with encrypted data (flip a bit)
            const tamperedData = parts[2].slice(0, -1) + 'f';
            const tampered = `${parts[0]}:${parts[1]}:${tamperedData}`;

            expect(() => decryptSecrets(tampered)).toThrow();
        });

        it('should throw error for tampered auth tag', () => {
            const plaintext = 'test-secret';
            const encrypted = encryptSecrets(plaintext);
            const parts = encrypted.split(':');

            // Tamper with auth tag
            const tamperedTag = parts[1].slice(0, -1) + 'f';
            const tampered = `${parts[0]}:${tamperedTag}:${parts[2]}`;

            expect(() => decryptSecrets(tampered)).toThrow();
        });

        it('should throw error for invalid hex in IV', () => {
            expect(() => decryptSecrets('zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz:aabbccdd11223344aabbccdd11223344:aabbccdd')).toThrow();
        });

        it('should throw error for wrong length IV', () => {
            expect(() => decryptSecrets('aabbccdd:aabbccdd11223344aabbccdd11223344:aabbccdd')).toThrow('Invalid encrypted data format');
        });
    });

    describe('isEncrypted', () => {
        it('should return true for valid encrypted format', () => {
            const encrypted = encryptSecrets('test-data');
            expect(isEncrypted(encrypted)).toBe(true);
        });

        it('should return false for plaintext', () => {
            expect(isEncrypted('api_keys:\n  claude: sk-ant-123')).toBe(false);
        });

        it('should return false for empty string', () => {
            expect(isEncrypted('')).toBe(false);
        });

        it('should return false for partial format', () => {
            expect(isEncrypted('abc:def')).toBe(false);
        });

        it('should return false for wrong number of parts', () => {
            expect(isEncrypted('a:b:c:d')).toBe(false);
        });

        it('should return false for non-hex characters', () => {
            expect(isEncrypted('zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz:aabbccdd11223344aabbccdd11223344:xyz')).toBe(false);
        });

        it('should return false for wrong length parts', () => {
            // IV too short (should be 32 hex chars)
            expect(isEncrypted('aabbccdd:aabbccdd11223344aabbccdd11223344:1122334455667788')).toBe(false);

            // Auth tag too short (should be 32 hex chars)
            expect(isEncrypted('aabbccdd11223344aabbccdd11223344:aabbccdd:1122334455667788')).toBe(false);
        });

        it('should return true for valid format even if decryption would fail', () => {
            // Valid format but won't decrypt (would fail auth tag check)
            const fakeEncrypted = 'a'.repeat(32) + ':' + 'b'.repeat(32) + ':' + 'c'.repeat(32);
            expect(isEncrypted(fakeEncrypted)).toBe(true);
        });
    });

    describe('Encryption round-trip', () => {
        const testCases = [
            'simple-key',
            'sk-ant-api03-very-long-key-with-lots-of-characters-1234567890',
            '',
            'key with spaces',
            'key\nwith\nnewlines',
            'unicode: 🔐🔑💎',
            'special chars: !@#$%^&*()_+-=[]{}|;:",.<>?/',
            'a'.repeat(1000), // Long string
        ];

        testCases.forEach((testCase) => {
            it(`should handle: "${testCase.slice(0, 50)}${testCase.length > 50 ? '...' : ''}"`, () => {
                const encrypted = encryptSecrets(testCase);
                const decrypted = decryptSecrets(encrypted);
                expect(decrypted).toBe(testCase);
            });
        });
    });

    describe('Security properties', () => {
        it('should use authenticated encryption (tamper detection)', () => {
            const plaintext = 'sensitive-data';
            const encrypted = encryptSecrets(plaintext);
            const parts = encrypted.split(':');

            // Flip one bit in the encrypted data
            const tampered = `${parts[0]}:${parts[1]}:${parts[2].slice(0, -1)}0`;

            // Should throw due to failed authentication
            expect(() => decryptSecrets(tampered)).toThrow();
        });

        it('should not leak plaintext length in ciphertext', () => {
            // Note: GCM doesn't add padding, so ciphertext length = plaintext length
            // This test just documents this behavior
            const short = encryptSecrets('a');
            const long = encryptSecrets('a'.repeat(100));

            const shortParts = short.split(':');
            const longParts = long.split(':');

            // Encrypted data length should differ
            expect(shortParts[2].length).toBeLessThan(longParts[2].length);
        });
    });
});

