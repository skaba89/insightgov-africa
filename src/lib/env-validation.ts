/**
 * InsightGov Africa - Environment Validation Utility
 * ===================================================
 * Validates environment variables at startup and provides
 * a comprehensive report of missing or invalid configuration.
 */

export interface EnvVarConfig {
  name: string;
  required: boolean;
  description: string;
  default?: string;
  validate?: (value: string | undefined) => boolean | string;
  sensitive?: boolean; // Hide value in logs
}

// Environment variable configuration
export const ENV_CONFIG: EnvVarConfig[] = [
  // Required - Core
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL connection string',
    sensitive: true,
    validate: (value) => {
      if (!value) return false;
      // Check if it's a valid PostgreSQL URL
      if (value.startsWith('postgresql://') || value.startsWith('postgres://')) {
        return true;
      }
      // SQLite is also valid for development
      if (value.startsWith('file:')) {
        return 'SQLite database (development mode)';
      }
      return 'Invalid database URL format';
    },
  },
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    description: 'Secret key for NextAuth.js session encryption',
    sensitive: true,
    validate: (value) => {
      if (!value) return false;
      if (value.length < 32) return 'Secret should be at least 32 characters';
      return true;
    },
  },
  {
    name: 'NEXTAUTH_URL',
    required: true,
    description: 'Public URL of the application',
    validate: (value) => {
      if (!value) return false;
      try {
        new URL(value);
        return true;
      } catch {
        return 'Invalid URL format';
      }
    },
  },

  // Optional - AI
  {
    name: 'AI_PROVIDER',
    required: false,
    description: 'AI provider to use (openai, groq)',
    default: 'groq',
  },
  {
    name: 'GROQ_API_KEY',
    required: false,
    description: 'GROQ API key for AI features',
    sensitive: true,
  },
  {
    name: 'OPENAI_API_KEY',
    required: false,
    description: 'OpenAI API key for AI features',
    sensitive: true,
  },

  // Optional - Payments
  {
    name: 'PAYSTACK_SECRET_KEY',
    required: false,
    description: 'Paystack secret key for payments',
    sensitive: true,
  },
  {
    name: 'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY',
    required: false,
    description: 'Paystack public key for frontend',
  },
  {
    name: 'ORANGE_MONEY_API_KEY',
    required: false,
    description: 'Orange Money API key',
    sensitive: true,
  },
  {
    name: 'MTN_MONEY_API_KEY',
    required: false,
    description: 'MTN Money API key',
    sensitive: true,
  },

  // Optional - Communication
  {
    name: 'RESEND_API_KEY',
    required: false,
    description: 'Resend API key for emails',
    sensitive: true,
  },
  {
    name: 'AFRICAS_TALKING_API_KEY',
    required: false,
    description: "Africa's Talking API key for SMS",
    sensitive: true,
  },

  // Optional - Monitoring
  {
    name: 'SENTRY_DSN',
    required: false,
    description: 'Sentry DSN for error tracking',
    sensitive: true,
  },

  // Optional - Cache
  {
    name: 'REDIS_URL',
    required: false,
    description: 'Redis connection URL for caching',
    sensitive: true,
  },

  // Optional - Admin
  {
    name: 'ADMIN_EMAIL',
    required: false,
    description: 'Initial admin user email',
  },
  {
    name: 'ADMIN_PASSWORD',
    required: false,
    description: 'Initial admin user password',
    sensitive: true,
  },
];

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  invalid: Array<{ name: string; reason: string }>;
  warnings: string[];
  config: Record<string, { value: string | undefined; configured: boolean; source: string }>;
}

/**
 * Validate all environment variables
 */
export function validateEnv(): EnvValidationResult {
  const missing: string[] = [];
  const invalid: Array<{ name: string; reason: string }> = [];
  const warnings: string[] = [];
  const config: Record<string, { value: string | undefined; configured: boolean; source: string }> = {};

  for (const envVar of ENV_CONFIG) {
    const value = process.env[envVar.name];
    const configured = value !== undefined && value !== '';

    // Check required variables
    if (envVar.required && !configured) {
      missing.push(envVar.name);
      continue;
    }

    // Run custom validation
    if (configured && envVar.validate) {
      const result = envVar.validate(value);
      if (result === false) {
        invalid.push({ name: envVar.name, reason: 'Validation failed' });
      } else if (typeof result === 'string') {
        warnings.push(`${envVar.name}: ${result}`);
      }
    }

    // Track configuration status
    config[envVar.name] = {
      value: envVar.sensitive ? '***' : value,
      configured,
      source: configured ? 'env' : (envVar.default ? 'default' : 'not_set'),
    };
  }

  // Add helpful warnings
  if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) {
    warnings.push('No AI provider configured - AI features will be limited');
  }

  if (!process.env.PAYSTACK_SECRET_KEY && !process.env.ORANGE_MONEY_API_KEY && !process.env.MTN_MONEY_API_KEY) {
    warnings.push('No payment provider configured - Payment features will be disabled');
  }

  if (!process.env.RESEND_API_KEY && !process.env.SMTP_HOST) {
    warnings.push('No email provider configured - Email features will be disabled');
  }

  return {
    valid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
    warnings,
    config,
  };
}

/**
 * Log environment validation results
 */
export function logEnvValidation(): void {
  const result = validateEnv();

  console.log('\n========================================');
  console.log('🔍 Environment Validation');
  console.log('========================================\n');

  if (result.valid) {
    console.log('✅ All required environment variables are configured\n');
  } else {
    if (result.missing.length > 0) {
      console.log('❌ Missing required variables:');
      result.missing.forEach((name) => console.log(`   - ${name}`));
      console.log('');
    }

    if (result.invalid.length > 0) {
      console.log('❌ Invalid variables:');
      result.invalid.forEach(({ name, reason }) => console.log(`   - ${name}: ${reason}`));
      console.log('');
    }
  }

  if (result.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    result.warnings.forEach((warning) => console.log(`   - ${warning}`));
    console.log('');
  }

  console.log('📋 Configuration Status:');
  Object.entries(result.config)
    .filter(([_, { configured }]) => configured)
    .forEach(([name, { source }]) => {
      console.log(`   ✅ ${name} (${source})`);
    });
  console.log('');

  console.log('========================================\n');
}

/**
 * Get a required environment variable or throw an error
 */
export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

/**
 * Get an optional environment variable with a default value
 */
export function getOptionalEnv(name: string, defaultValue?: string): string | undefined {
  return process.env[name] || defaultValue;
}

/**
 * Check if we're running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if we're running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if database is PostgreSQL
 */
export function isPostgreSQL(): boolean {
  const dbUrl = process.env.DATABASE_URL || '';
  return dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');
}

/**
 * Check if database is SQLite (development)
 */
export function isSQLite(): boolean {
  const dbUrl = process.env.DATABASE_URL || '';
  return dbUrl.startsWith('file:');
}
