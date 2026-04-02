/**
 * InsightGov Africa - Supabase Database Types
 * ============================================
 * Types TypeScript générés automatiquement pour Supabase.
 * Ces types représentent la structure de la base de données.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          type: 'ministry' | 'ngo' | 'enterprise';
          sector: Database['public']['Enums']['sector_type'];
          subscription_tier: 'free' | 'starter' | 'professional' | 'enterprise';
          logo_url: string | null;
          country: string | null;
          city: string | null;
          phone: string | null;
          website: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: 'ministry' | 'ngo' | 'enterprise';
          sector: Database['public']['Enums']['sector_type'];
          subscription_tier?: 'free' | 'starter' | 'professional' | 'enterprise';
          logo_url?: string | null;
          country?: string | null;
          city?: string | null;
          phone?: string | null;
          website?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: 'ministry' | 'ngo' | 'enterprise';
          sector?: Database['public']['Enums']['sector_type'];
          subscription_tier?: 'free' | 'starter' | 'professional' | 'enterprise';
          logo_url?: string | null;
          country?: string | null;
          city?: string | null;
          phone?: string | null;
          website?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          organization_id: string;
          role: 'owner' | 'admin' | 'analyst' | 'viewer';
          is_active: boolean;
          email_verified: string | null;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          organization_id: string;
          role?: 'owner' | 'admin' | 'analyst' | 'viewer';
          is_active?: boolean;
          email_verified?: string | null;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          organization_id?: string;
          role?: 'owner' | 'admin' | 'analyst' | 'viewer';
          is_active?: boolean;
          email_verified?: string | null;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      datasets: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          original_file_name: string;
          file_url: string;
          file_size: number;
          file_type: 'csv' | 'xlsx' | 'xls';
          row_count: number;
          column_count: number;
          columns_metadata: Json;
          status: 'uploading' | 'pending' | 'analyzing' | 'ready' | 'error';
          error_message: string | null;
          analyzed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          original_file_name: string;
          file_url: string;
          file_size: number;
          file_type: 'csv' | 'xlsx' | 'xls';
          row_count?: number;
          column_count?: number;
          columns_metadata?: Json;
          status?: 'uploading' | 'pending' | 'analyzing' | 'ready' | 'error';
          error_message?: string | null;
          analyzed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          original_file_name?: string;
          file_url?: string;
          file_size?: number;
          file_type?: 'csv' | 'xlsx' | 'xls';
          row_count?: number;
          column_count?: number;
          columns_metadata?: Json;
          status?: 'uploading' | 'pending' | 'analyzing' | 'ready' | 'error';
          error_message?: string | null;
          analyzed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      kpis: {
        Row: {
          id: string;
          dataset_id: string;
          version: number;
          config_json: Json;
          is_published: boolean;
          generated_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          dataset_id: string;
          version?: number;
          config_json: Json;
          is_published?: boolean;
          generated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          dataset_id?: string;
          version?: number;
          config_json?: Json;
          is_published?: boolean;
          generated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          organization_id: string;
          tier: 'free' | 'starter' | 'professional' | 'enterprise';
          status: 'active' | 'canceled' | 'expired' | 'past_due';
          price: number;
          currency: string;
          billing_cycle: string;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          paystack_customer_id: string | null;
          paystack_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          tier: 'free' | 'starter' | 'professional' | 'enterprise';
          status?: 'active' | 'canceled' | 'expired' | 'past_due';
          price?: number;
          currency?: string;
          billing_cycle?: string;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          paystack_customer_id?: string | null;
          paystack_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          tier?: 'free' | 'starter' | 'professional' | 'enterprise';
          status?: 'active' | 'canceled' | 'expired' | 'past_due';
          price?: number;
          currency?: string;
          billing_cycle?: string;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          paystack_customer_id?: string | null;
          paystack_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          expires_at: string;
          user_agent: string | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          expires_at: string;
          user_agent?: string | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          expires_at?: string;
          user_agent?: string | null;
          ip_address?: string | null;
          created_at?: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          provider_id: string;
          access_token: string | null;
          refresh_token: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: string;
          provider_id: string;
          access_token?: string | null;
          refresh_token?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: string;
          provider_id?: string;
          access_token?: string | null;
          refresh_token?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      report_exports: {
        Row: {
          id: string;
          dataset_id: string;
          user_id: string;
          format: 'pdf' | 'excel' | 'image';
          file_url: string | null;
          status: string;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          dataset_id: string;
          user_id: string;
          format: 'pdf' | 'excel' | 'image';
          file_url?: string | null;
          status?: string;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          dataset_id?: string;
          user_id?: string;
          format?: 'pdf' | 'excel' | 'image';
          file_url?: string | null;
          status?: string;
          error_message?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      organization_summary: {
        Row: {
          id: string;
          name: string;
          type: 'ministry' | 'ngo' | 'enterprise';
          sector: Database['public']['Enums']['sector_type'];
          subscription_tier: 'free' | 'starter' | 'professional' | 'enterprise';
          user_count: number;
          dataset_count: number;
          total_storage_bytes: number;
          last_dataset_upload: string | null;
        };
      };
      dataset_with_kpis: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          original_file_name: string;
          file_url: string;
          file_size: number;
          file_type: 'csv' | 'xlsx' | 'xls';
          row_count: number;
          column_count: number;
          columns_metadata: Json;
          status: 'uploading' | 'pending' | 'analyzing' | 'ready' | 'error';
          error_message: string | null;
          analyzed_at: string | null;
          created_at: string;
          updated_at: string;
          kpi_count: number;
          last_kpi_generated: string | null;
        };
      };
    };
    Functions: {
      get_dataset_count: {
        Args: {
          org_id: string;
        };
        Returns: number;
      };
      get_storage_usage: {
        Args: {
          org_id: string;
        };
        Returns: number;
      };
      clean_expired_sessions: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: {
      sector_type:
        | 'health'
        | 'education'
        | 'agriculture'
        | 'finance'
        | 'infrastructure'
        | 'energy'
        | 'social'
        | 'environment'
        | 'trade'
        | 'mining'
        | 'transport'
        | 'telecom'
        | 'other';
    };
  };
}

// Types utilitaires pour faciliter l'utilisation
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row'];

// Types spécifiques pour les tables principales
export type Organization = Tables<'organizations'>;
export type User = Tables<'users'>;
export type Dataset = Tables<'datasets'>;
export type KPI = Tables<'kpis'>;
export type Subscription = Tables<'subscriptions'>;
export type Session = Tables<'sessions'>;
export type Account = Tables<'accounts'>;
export type ReportExport = Tables<'report_exports'>;
