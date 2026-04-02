/**
 * InsightGov Africa - SAML/SSO Provider Configuration
 * =====================================================
 * Enterprise SSO integration supporting Microsoft Entra ID (Azure AD), Okta, and Google Workspace.
 */

import { randomBytes, createHash } from 'crypto';

// SSO Provider Types
export type SSOProvider = 'azure-ad' | 'okta' | 'google-workspace' | 'custom';

// SAML Configuration Interface
export interface SAMLConfig {
  id: string;
  organizationId: string;
  provider: SSOProvider;
  displayName: string;
  
  // SAML Configuration
  entryPoint: string;           // Identity Provider SSO URL
  issuer: string;               // Service Provider Entity ID
  callbackUrl: string;          // Assertion Consumer Service URL
  cert: string;                 // Identity Provider Certificate (X.509)
  privateKey?: string;          // Service Provider Private Key (for signed requests)
  
  // Attribute Mapping
  attributeMapping: {
    email: string;              // Email attribute name from IdP
    firstName: string;          // First name attribute
    lastName: string;           // Last name attribute
    groups?: string;            // Groups/roles attribute
    department?: string;        // Department attribute
  };
  
  // Settings
  wantAssertionsSigned: boolean;
  wantResponseSigned: boolean;
  signMetadata: boolean;
  identifierFormat: string;
  acceptedClockSkewMs: number;
  
  // Auto-provisioning
  autoProvision: boolean;
  defaultRole: string;
  groupRoleMapping?: Record<string, string>;
  
  // Status
  isActive: boolean;
  isDefault: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
}

// Provider Templates for common SSO providers
export const SSO_PROVIDER_TEMPLATES: Record<SSOProvider, Partial<SAMLConfig>> = {
  'azure-ad': {
    displayName: 'Microsoft Entra ID (Azure AD)',
    identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
    wantAssertionsSigned: true,
    wantResponseSigned: false,
    signMetadata: true,
    acceptedClockSkewMs: 300000, // 5 minutes
    attributeMapping: {
      email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
      firstName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
      lastName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
      groups: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/groups',
      department: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/department',
    },
  },
  'okta': {
    displayName: 'Okta',
    identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:emailAddress',
    wantAssertionsSigned: true,
    wantResponseSigned: false,
    signMetadata: false,
    acceptedClockSkewMs: 180000, // 3 minutes
    attributeMapping: {
      email: 'email',
      firstName: 'firstName',
      lastName: 'lastName',
      groups: 'groups',
      department: 'department',
    },
  },
  'google-workspace': {
    displayName: 'Google Workspace',
    identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:emailAddress',
    wantAssertionsSigned: true,
    wantResponseSigned: false,
    signMetadata: false,
    acceptedClockSkewMs: 300000, // 5 minutes
    attributeMapping: {
      email: 'email',
      firstName: 'firstName',
      lastName: 'lastName',
      groups: 'groups',
    },
  },
  'custom': {
    displayName: 'Custom SAML Provider',
    identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
    wantAssertionsSigned: true,
    wantResponseSigned: true,
    signMetadata: true,
    acceptedClockSkewMs: 300000,
    attributeMapping: {
      email: 'email',
      firstName: 'firstName',
      lastName: 'lastName',
    },
  },
};

// Generate SAML metadata XML for Service Provider
export function generateSAMLMetadata(config: SAMLConfig): string {
  const { issuer, callbackUrl, cert, wantAssertionsSigned } = config;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" 
                     entityID="${issuer}">
  <md:SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol"
                      AuthnRequestsSigned="true"
                      WantAssertionsSigned="${wantAssertionsSigned}">
    <md:NameIDFormat>${config.identifierFormat}</md:NameIDFormat>
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                                 Location="${callbackUrl}"
                                 index="1"/>
    <md:AttributeConsumingService index="1">
      <md:ServiceName xml:lang="en">InsightGov Africa</md:ServiceName>
      <md:RequestedAttribute Name="${config.attributeMapping.email}" isRequired="true"/>
      <md:RequestedAttribute Name="${config.attributeMapping.firstName}" isRequired="false"/>
      <md:RequestedAttribute Name="${config.attributeMapping.lastName}" isRequired="false"/>
    </md:AttributeConsumingService>
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;
}

// Generate a secure random state for SAML requests
export function generateSAMLState(): string {
  return randomBytes(32).toString('hex');
}

// Generate a secure relay state
export function generateRelayState(redirectUrl?: string): string {
  const state = generateSAMLState();
  if (redirectUrl) {
    return Buffer.from(JSON.stringify({ state, redirect: redirectUrl })).toString('base64');
  }
  return state;
}

// Parse relay state
export function parseRelayState(relayState: string): { state: string; redirect?: string } | null {
  try {
    const decoded = Buffer.from(relayState, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch {
    return { state: relayState };
  }
}

// Extract user attributes from SAML assertion
export interface SAMLAssertion {
  nameID: string;
  attributes: Record<string, string | string[]>;
  sessionIndex?: string;
}

// Map SAML attributes to user profile
export function mapSAMLAttributes(
  assertion: SAMLAssertion,
  config: SAMLConfig
): {
  email: string;
  firstName?: string;
  lastName?: string;
  groups?: string[];
  department?: string;
  role: string;
} {
  const { attributeMapping, defaultRole, groupRoleMapping } = config;
  
  const getAttributeValue = (attrName: string): string | undefined => {
    const value = assertion.attributes[attrName];
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  };

  const getAttributeArray = (attrName: string): string[] => {
    const value = assertion.attributes[attrName];
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string') {
      return [value];
    }
    return [];
  };

  const email = getAttributeValue(attributeMapping.email) || assertion.nameID;
  const firstName = attributeMapping.firstName ? getAttributeValue(attributeMapping.firstName) : undefined;
  const lastName = attributeMapping.lastName ? getAttributeValue(attributeMapping.lastName) : undefined;
  const groups = attributeMapping.groups ? getAttributeArray(attributeMapping.groups) : [];
  const department = attributeMapping.department ? getAttributeValue(attributeMapping.department) : undefined;

  // Determine role from group mapping
  let role = defaultRole;
  if (groupRoleMapping && groups.length > 0) {
    for (const group of groups) {
      if (groupRoleMapping[group]) {
        role = groupRoleMapping[group];
        break;
      }
    }
  }

  return {
    email,
    firstName,
    lastName,
    groups,
    department,
    role,
  };
}

// Validate SAML configuration
export function validateSAMLConfig(config: Partial<SAMLConfig>): string[] {
  const errors: string[] = [];

  if (!config.provider) {
    errors.push('Provider type is required');
  }

  if (!config.entryPoint) {
    errors.push('Identity Provider entry point URL is required');
  } else {
    try {
      new URL(config.entryPoint);
    } catch {
      errors.push('Invalid entry point URL format');
    }
  }

  if (!config.issuer) {
    errors.push('Service Provider issuer/entity ID is required');
  }

  if (!config.callbackUrl) {
    errors.push('Callback URL is required');
  } else {
    try {
      new URL(config.callbackUrl);
    } catch {
      errors.push('Invalid callback URL format');
    }
  }

  if (!config.cert) {
    errors.push('Identity Provider certificate is required');
  } else {
    // Basic certificate validation
    const certPattern = /-----BEGIN CERTIFICATE-----[\s\S]*-----END CERTIFICATE-----/;
    if (!certPattern.test(config.cert)) {
      errors.push('Invalid certificate format (expected PEM format)');
    }
  }

  if (config.attributeMapping && !config.attributeMapping.email) {
    errors.push('Email attribute mapping is required');
  }

  return errors;
}

// Create default SAML configuration for a provider
export function createDefaultSAMLConfig(
  organizationId: string,
  provider: SSOProvider,
  baseUrl: string
): Partial<SAMLConfig> {
  const template = SSO_PROVIDER_TEMPLATES[provider];
  const orgIdShort = organizationId.slice(0, 8);

  return {
    ...template,
    organizationId,
    provider,
    issuer: `${baseUrl}/saml/${orgIdShort}`,
    callbackUrl: `${baseUrl}/api/auth/saml/callback`,
    autoProvision: true,
    defaultRole: 'viewer',
    isActive: false,
    isDefault: false,
  };
}

// Hash sensitive data for logging
export function hashForLogging(data: string): string {
  return createHash('sha256').update(data).digest('hex').slice(0, 16);
}

// SAML Login URL generation
export function generateSAMLLoginUrl(config: SAMLConfig, relayState?: string): string {
  const params = new URLSearchParams({
    SAMLRequest: Buffer.from(generateSAMLRequest(config)).toString('base64'),
  });

  if (relayState) {
    params.append('RelayState', relayState);
  }

  return `${config.entryPoint}?${params.toString()}`;
}

// Generate SAML AuthnRequest
function generateSAMLRequest(config: SAMLConfig): string {
  const timestamp = new Date().toISOString();
  const id = `_${randomBytes(20).toString('hex')}`;

  return `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                           ID="${id}"
                           Version="2.0"
                           IssueInstant="${timestamp}"
                           ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                           AssertionConsumerServiceURL="${config.callbackUrl}">
    <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${config.issuer}</saml:Issuer>
    <samlp:NameIDPolicy xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                        Format="${config.identifierFormat}"
                        AllowCreate="true"/>
  </samlp:AuthnRequest>`;
}

// Logout URL generation
export function generateSAMLLogoutUrl(
  config: SAMLConfig,
  nameID: string,
  sessionIndex?: string
): string {
  const timestamp = new Date().toISOString();
  const id = `_${randomBytes(20).toString('hex')}`;

  let logoutRequest = `<samlp:LogoutRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                           ID="${id}"
                           Version="2.0"
                           IssueInstant="${timestamp}">
    <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${config.issuer}</saml:Issuer>
    <saml:NameID xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                 Format="${config.identifierFormat}">${nameID}</saml:NameID>`;

  if (sessionIndex) {
    logoutRequest += `
    <samlp:SessionIndex xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">${sessionIndex}</samlp:SessionIndex>`;
  }

  logoutRequest += `
  </samlp:LogoutRequest>`;

  const params = new URLSearchParams({
    SAMLRequest: Buffer.from(logoutRequest).toString('base64'),
  });

  return `${config.entryPoint}?${params.toString()}`;
}

export default {
  SSO_PROVIDER_TEMPLATES,
  generateSAMLMetadata,
  generateSAMLState,
  generateRelayState,
  parseRelayState,
  mapSAMLAttributes,
  validateSAMLConfig,
  createDefaultSAMLConfig,
  generateSAMLLoginUrl,
  generateSAMLLogoutUrl,
  hashForLogging,
};
