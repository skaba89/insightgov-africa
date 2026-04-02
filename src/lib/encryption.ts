import crypto from 'crypto'

/**
 * Encryption utilities for sensitive data
 * Uses AES-256-GCM for encryption (best practice)
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 64

// Get encryption key from environment
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set')
  }
  
  // Key should be 32 bytes (256 bits) for AES-256
  if (key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters')
  }
  
  return Buffer.from(key.slice(0, 32), 'utf-8')
}

/**
 * Derive a key from password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512')
}

/**
 * Encrypt sensitive data
 * @param plaintext - Data to encrypt
 * @returns Encrypted data in format: salt:iv:authTag:ciphertext (all hex encoded)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  
  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH)
  const iv = crypto.randomBytes(IV_LENGTH)
  
  // Derive key from master key and salt
  const derivedKey = deriveKey(key.toString('hex'), salt)
  
  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv, {
    authTagLength: AUTH_TAG_LENGTH
  })
  
  // Encrypt
  let ciphertext = cipher.update(plaintext, 'utf8', 'hex')
  ciphertext += cipher.final('hex')
  
  // Get auth tag
  const authTag = cipher.getAuthTag()
  
  // Return formatted encrypted data
  return [
    salt.toString('hex'),
    iv.toString('hex'),
    authTag.toString('hex'),
    ciphertext
  ].join(':')
}

/**
 * Decrypt sensitive data
 * @param encryptedData - Data in format: salt:iv:authTag:ciphertext
 * @returns Decrypted plaintext
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey()
  
  // Parse encrypted data
  const parts = encryptedData.split(':')
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted data format')
  }
  
  const [saltHex, ivHex, authTagHex, ciphertext] = parts
  const salt = Buffer.from(saltHex, 'hex')
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  
  // Derive key
  const derivedKey = deriveKey(key.toString('hex'), salt)
  
  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv, {
    authTagLength: AUTH_TAG_LENGTH
  })
  
  // Set auth tag for verification
  decipher.setAuthTag(authTag)
  
  // Decrypt
  let plaintext = decipher.update(ciphertext, 'hex', 'utf8')
  plaintext += decipher.final('utf8')
  
  return plaintext
}

/**
 * Hash a value using SHA-256
 * @param value - Value to hash
 * @returns Hex encoded hash
 */
export function hash(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

/**
 * Generate a secure random token
 * @param length - Length of the token in bytes (default 32)
 * @returns Hex encoded random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Generate a secure API key
 * @param prefix - Optional prefix for the key (e.g., 'sk_live_')
 * @returns API key
 */
export function generateApiKey(prefix: string = 'iga_'): string {
  const key = crypto.randomBytes(32).toString('base64url')
  return `${prefix}${key}`
}

/**
 * Verify a password against a hash using constant-time comparison
 * @param password - Plain text password
 * @param hashedPassword - Hashed password
 * @returns Boolean indicating match
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const hashToCompare = hash(password)
  return crypto.timingSafeEqual(
    Buffer.from(hashToCompare, 'hex'),
    Buffer.from(hashedPassword, 'hex')
  )
}

/**
 * Mask sensitive data for display (e.g., API keys, credit cards)
 * @param value - Value to mask
 * @param visibleChars - Number of characters to show at start and end
 * @returns Masked value
 */
export function maskSensitiveData(value: string, visibleChars: number = 4): string {
  if (value.length <= visibleChars * 2) {
    return '*'.repeat(value.length)
  }
  
  const start = value.slice(0, visibleChars)
  const end = value.slice(-visibleChars)
  const middle = '*'.repeat(Math.min(value.length - visibleChars * 2, 20))
  
  return `${start}${middle}${end}`
}

/**
 * Constant-time string comparison to prevent timing attacks
 * @param a - First string
 * @param b - Second string
 * @returns Boolean indicating equality
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  
  return crypto.timingSafeEqual(
    Buffer.from(a, 'utf8'),
    Buffer.from(b, 'utf8')
  )
}

/**
 * Generate HMAC signature for webhook verification
 * @param payload - Data to sign
 * @param secret - Secret key
 * @returns Hex encoded signature
 */
export function generateHmacSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
}

/**
 * Verify HMAC signature
 * @param payload - Original data
 * @param signature - Signature to verify
 * @param secret - Secret key
 * @returns Boolean indicating validity
 */
export function verifyHmacSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = generateHmacSignature(payload, secret)
  return secureCompare(signature, expectedSignature)
}
