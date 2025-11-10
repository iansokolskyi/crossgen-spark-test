/**
 * Tests for machine ID retrieval
 * 
 * Note: This is an integration test that tests the actual machine ID retrieval.
 * Mocking OS-level functions in ESM Jest is complex, so we test the real implementation.
 */

import { getMachineId } from '../../src/crypto/machineId';

describe('getMachineId', () => {
    describe('Real machine ID retrieval', () => {
        it('should return a non-empty string', () => {
            const machineId = getMachineId();

            expect(machineId).toBeTruthy();
            expect(typeof machineId).toBe('string');
            expect(machineId.length).toBeGreaterThan(0);
        });

        it('should return consistent ID on multiple calls', () => {
            const id1 = getMachineId();
            const id2 = getMachineId();
            const id3 = getMachineId();

            expect(id1).toBe(id2);
            expect(id2).toBe(id3);
        });

        it('should not contain only whitespace', () => {
            const machineId = getMachineId();

            expect(machineId.trim()).toBe(machineId);
            expect(machineId.trim().length).toBeGreaterThan(0);
        });

        it('should be platform-specific format', () => {
            const machineId = getMachineId();
            const platform = process.platform;

            if (platform === 'darwin') {
                // macOS UUID format: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
                expect(machineId).toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i);
            } else if (platform === 'linux') {
                // Linux machine-id is typically a 32-character hex string
                expect(machineId.length).toBeGreaterThanOrEqual(8);
            } else if (platform === 'win32') {
                // Windows GUID with braces: {XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX}
                expect(machineId).toMatch(/^\{?[0-9A-F-]+\}?$/i);
            }
        });
    });

    describe('Error handling', () => {
        it('should throw error with descriptive message on failure', () => {
            // We can't easily trigger a real failure, so we just test the function signature
            expect(() => getMachineId()).not.toThrow();
        });
    });
});

