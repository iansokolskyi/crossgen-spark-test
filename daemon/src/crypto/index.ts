/**
 * Spark Crypto Module
 *
 * Machine-specific encryption for secrets storage.
 * Zero third-party dependencies - uses only Node.js built-ins.
 */

export { getMachineId } from './machineId.js';
export { encryptSecrets, decryptSecrets, isEncrypted } from './encryption.js';
