-- ===========================================
-- EXECUTIVE DASHBOARD - SUPABASE SCHEMA
-- ===========================================
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    status TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'qualified', 'proposal', 'won', 'lost')),
    source TEXT,
    estimated_value DECIMAL DEFAULT 0,
    notes TEXT,
    last_contact_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects Table (syncs with ClickUp)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    clickup_task_id TEXT UNIQUE,
    status TEXT DEFAULT 'active' CHECK (status IN ('planning', 'active', 'on_hold', 'completed')),
    budget DECIMAL DEFAULT 0,
    spent DECIMAL DEFAULT 0,
    start_date DATE,
    due_date DATE,
    health_score INTEGER DEFAULT 100 CHECK (health_score BETWEEN 0 AND 100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar Events Table (syncs with Google Calendar)
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_event_id TEXT UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location TEXT,
    attendees TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROI Metrics Table
CREATE TABLE IF NOT EXISTS roi_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE UNIQUE NOT NULL,
    time_saved_hours DECIMAL DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    tasks_synced INTEGER DEFAULT 0,
    events_synced INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation Logs Table
CREATE TABLE IF NOT EXISTS automation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_type TEXT NOT NULL,
    details TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_clickup ON projects(clickup_task_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_calendar_start ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_automation_created ON automation_logs(created_at);

-- Dashboard statistics view
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
    (SELECT COUNT(*) FROM clients WHERE status IN ('lead', 'qualified')) as active_leads,
    (SELECT COUNT(*) FROM projects WHERE status = 'active') as active_projects,
    (SELECT COALESCE(AVG(health_score), 0) FROM projects WHERE status = 'active') as avg_health,
    (SELECT COUNT(*) FROM invoices WHERE status = 'overdue') as overdue_invoices,
    (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE status = 'overdue') as overdue_amount,
    (SELECT COALESCE(SUM(amount), 0) FROM invoices WHERE status IN ('lead', 'qualified', 'proposal')) as pipeline_value,
    (SELECT COUNT(*) FROM calendar_events WHERE start_time > NOW() AND start_time < NOW() + INTERVAL '7 days') as upcoming_meetings,
    (SELECT COALESCE(SUM(time_saved_hours), 0) FROM roi_metrics WHERE metric_date >= CURRENT_DATE - 30) as monthly_time_saved;

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clients_timestamp ON clients;
CREATE TRIGGER update_clients_timestamp BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_projects_timestamp ON projects;
CREATE TRIGGER update_projects_timestamp BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS update_invoices_timestamp ON invoices;
CREATE TRIGGER update_invoices_timestamp BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Auto-update invoice status to overdue
CREATE OR REPLACE FUNCTION check_overdue_invoices()
RETURNS void AS $$
BEGIN
    UPDATE invoices 
    SET status = 'overdue' 
    WHERE status = 'sent' 
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (allow all for now)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all clients" ON clients;
CREATE POLICY "Allow all clients" ON clients FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all projects" ON projects;
CREATE POLICY "Allow all projects" ON projects FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all invoices" ON invoices;
CREATE POLICY "Allow all invoices" ON invoices FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all calendar" ON calendar_events;
CREATE POLICY "Allow all calendar" ON calendar_events FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all roi" ON roi_metrics;
CREATE POLICY "Allow all roi" ON roi_metrics FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all logs" ON automation_logs;
CREATE POLICY "Allow all logs" ON automation_logs FOR ALL USING (true);


-- Settings Table (for dynamic API configuration)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all settings" ON settings;
CREATE POLICY "Allow all settings" ON settings FOR ALL USING (true);

-- Insert default empty settings keys if they don't exist
INSERT INTO settings (key, description) VALUES
    ('clickup_api_token', 'ClickUp Personal API Token'),
    ('clickup_space_id', 'ClickUp Space ID'),
    ('google_client_email', 'Google Service Account Email'),
    ('google_private_key', 'Google Service Account Private Key'),
    ('gmail_sender_email', 'Gmail Sender Address'),
    ('ollama_base_url', 'Ollama API URL'),
    ('ollama_model', 'Ollama Model Name')
ON CONFLICT DO NOTHING;
