-- Twilio Call Center — Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text not null,
  role text not null default 'agent' check (role in ('admin', 'agent')),
  created_at timestamptz not null default now()
);

-- Calls table
create table if not exists calls (
  id uuid primary key default uuid_generate_v4(),
  sid text unique not null,
  from_number text not null,
  to_number text not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  status text not null default 'queued' check (
    status in ('queued', 'ringing', 'in-progress', 'completed', 'failed', 'busy', 'no-answer', 'canceled')
  ),
  duration integer,
  recording_url text,
  created_at timestamptz not null default now()
);

-- Index for fast queries
create index if not exists calls_status_idx on calls(status);
create index if not exists calls_direction_idx on calls(direction);
create index if not exists calls_created_at_idx on calls(created_at desc);
create index if not exists calls_from_number_idx on calls(from_number);
create index if not exists calls_to_number_idx on calls(to_number);

-- Contacts table
create table if not exists contacts (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null,
  company text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists contacts_name_idx on contacts(name);
create index if not exists contacts_phone_idx on contacts(phone);

-- Settings table (single row)
create table if not exists settings (
  id uuid primary key default uuid_generate_v4(),
  twilio_account_sid text not null default '',
  twilio_auth_token text not null default '',
  twilio_phone_number text not null default '',
  twilio_twiml_app_sid text not null default '',
  updated_at timestamptz not null default now()
);

-- Row Level Security
-- For MVP, disable RLS so service role can read/write freely
-- In production, enable RLS and add proper policies

alter table calls disable row level security;
alter table contacts disable row level security;
alter table settings disable row level security;
alter table users disable row level security;

-- Sample data (optional — comment out for production)
insert into contacts (name, phone, company, notes) values
  ('Alice Johnson', '+15551234567', 'Acme Corp', 'Key account manager'),
  ('Bob Smith', '+15559876543', 'Globex Inc', 'Prefer morning calls'),
  ('Carol White', '+15555551234', 'Initech', 'CEO contact')
on conflict do nothing;
