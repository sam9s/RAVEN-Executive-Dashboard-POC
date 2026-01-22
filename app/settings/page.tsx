'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import {
    Save, RefreshCw, CheckCircle, AlertCircle,
    Database, Layout, Calendar, Bot,
    Eye, EyeOff, Lock, Mail
} from 'lucide-react'

interface ServiceStatus {
    supabase: boolean
    clickup: boolean
    calendar: boolean
    ollama: boolean

    ollama_models: string[]
    ai_provider?: string
    openai?: boolean
    has_openai_key?: boolean
    google_authenticated?: boolean
}

export default function SettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [testing, setTesting] = useState<string | null>(null)
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
    const [status, setStatus] = useState<ServiceStatus>({
        supabase: false,
        clickup: false,
        calendar: false,
        ollama: false,
        openai: false,
        ollama_models: [],
        google_authenticated: false
    })

    // Settings form state
    const [settings, setSettings] = useState<Record<string, string>>({
        clickup_api_token: '',
        clickup_space_id: '',
        google_client_email: '',
        google_private_key: '',
        gmail_sender_email: '',
        ollama_base_url: 'http://localhost:11434',
        ollama_model: 'llama3:8b',
        ai_provider: 'ollama',
        openai_api_key: '',
        openai_model: 'gpt-4o',
        google_auth_url: ''
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            // Fetch health status
            await checkHealth()

            // Fetch stored settings
            const settingsRes = await fetch('/api/settings')
            const settingsData = await settingsRes.json()

            // Fetch Google Auth Status
            const authRes = await fetch('/api/auth/google')
            const authData = await authRes.json()

            let newSettings = { ...settings }
            if (settingsData.success && settingsData.settings) {
                newSettings = { ...newSettings, ...settingsData.settings }
            }

            if (authData.success) {
                newSettings.google_auth_url = authData.authUrl || ''
                setStatus(prev => ({ ...prev, google_authenticated: authData.authenticated }))
            }

            setSettings(newSettings)
        } catch (error) {
            console.error('Failed to load settings:', error)
        } finally {
            setLoading(false)
        }
    }

    const checkHealth = async () => {
        try {
            const res = await fetch('/api/health')
            const data = await res.json()
            if (data.success && data.services) {
                setStatus(prev => ({ ...prev, ...data.services }))
            }
        } catch (error) {
            console.error('Health check failed:', error)
        }
    }

    const handleSave = async (section: string) => {
        setSaving(section)
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings })
            })
            // Refresh status after saving
            await checkHealth()

            // Show specific success message
            if (section === 'clickup') {
                // Trigger a sync test potentially or just verify connectivity
                const test = await fetch('/api/health')
            }
            alert('Settings saved successfully!')
        } catch (error) {
            alert('Failed to save settings')
        } finally {
            setSaving(null)
        }
    }

    const handleTestConnection = async (service: string) => {
        setTesting(service)
        try {
            // Save first to ensure backend uses latest values
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings })
            })

            // Re-run health check
            await checkHealth()

            // Specific test feedback
            if (service === 'clickup') {
                const res = await fetch('/api/debug/clickup') // Use debug endpoint if available, or just rely on health
                // For now relying on health status update
            }

            await new Promise(resolve => setTimeout(resolve, 1000))

        } catch (error) {
            console.error(`Test ${service} failed:`, error)
            alert(`Test failed: ${error}`)
        } finally {
            setTesting(null)
        }
    }

    const toggleSecret = (key: string) => {
        setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const InputField = ({ label, id, placeholder, secret = false, multiline = false }: any) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="relative">
                {multiline ? (
                    <textarea
                        value={settings[id] || ''}
                        onChange={e => setSettings({ ...settings, [id]: e.target.value })}
                        placeholder={placeholder}
                        rows={4}
                        className="w-full px-4 py-2 bg-white border border-cream-300 rounded-lg focus:outline-none focus:border-gold-500 font-mono text-xs"
                    />
                ) : (
                    <input
                        type={secret && !showSecrets[id] ? 'password' : 'text'}
                        value={settings[id] || ''}
                        onChange={e => setSettings({ ...settings, [id]: e.target.value })}
                        placeholder={placeholder}
                        className="w-full px-4 py-2 bg-white border border-cream-300 rounded-lg focus:outline-none focus:border-gold-500 pr-10"
                    />
                )}
                {secret && !multiline && (
                    <button
                        onClick={() => toggleSecret(id)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        {showSecrets[id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                )}
            </div>
        </div>
    )

    const ServiceCard = ({
        id,
        title,
        icon: Icon,
        connected,
        description,
        children,
        onSave
    }: any) => (
        <div className="card-premium">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${connected ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-navy-900">{title}</h3>
                        <p className="text-sm text-gray-500">{description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {connected ? (
                            <><CheckCircle className="w-3 h-3" /> Connected</>
                        ) : (
                            <><AlertCircle className="w-3 h-3" /> Disconnected</>
                        )}
                    </span>
                </div>
            </div>

            <div className="space-y-4 border-t border-cream-200 pt-4">
                {children}

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={() => handleTestConnection(id)}
                        disabled={testing === id}
                        className="btn-secondary text-sm py-1.5"
                    >
                        {testing === id ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save & Test Connection'}
                    </button>
                </div>
            </div>
        </div>
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-cream-100 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gold-500" />
                    <p className="mt-4 text-gray-600">Loading settings...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-cream-100">
            <Header onSync={async () => { }} syncing={false} />

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-navy-900">Settings</h1>
                        <p className="text-gray-500 mt-1">Configure your dashboard integrations and APIs</p>
                    </div>
                    <button
                        onClick={() => handleSave('all')}
                        disabled={!!saving}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save All Settings'}
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Supabase */}
                    <ServiceCard
                        id="supabase"
                        title="Supabase Database"
                        icon={Database}
                        connected={status.supabase}
                        description="Primary database connection"
                    >
                        <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                            Connected via server-side environment variables
                        </div>
                    </ServiceCard>

                    {/* ClickUp */}
                    <ServiceCard
                        id="clickup"
                        title="ClickUp"
                        icon={Layout}
                        connected={status.clickup}
                        description="Project and task synchronization"
                        onSave={() => handleSave('clickup')}
                    >
                        <div className="grid gap-4">
                            <InputField
                                label="API Token (pk_...)"
                                id="clickup_api_token"
                                secret={true}
                                placeholder="pk_..."
                            />
                            <InputField
                                label="Space ID"
                                id="clickup_space_id"
                                placeholder="e.g. 12345678"
                            />
                        </div>
                    </ServiceCard>

                    {/* Google Services */}
                    <ServiceCard
                        id="calendar"
                        title="Google Workspace (Service Account)"
                        icon={Calendar}
                        connected={status.calendar}
                        description="Calendar events & Gmail (Requires Domain-Wide Delegation)"
                        onSave={() => handleSave('google')}
                    >
                        <div className="grid gap-4">
                            <InputField
                                label="Service Account Email (Optional if using OAuth)"
                                id="google_client_email"
                                placeholder="service-account@project.iam.gserviceaccount.com"
                            />
                            <div className="flex flex-col gap-2">
                                <label className="block text-sm font-medium text-gray-700">Google OAuth (Recommended for Personal Gmail)</label>
                                {status.google_authenticated ? (
                                    <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        Authenticated with Google Account
                                    </div>
                                ) : (
                                    <a
                                        href={settings.google_auth_url || '#'}
                                        onClick={(e) => {
                                            if (!settings.google_auth_url) e.preventDefault()
                                        }}
                                        className={`btn-secondary text-center block ${!settings.google_auth_url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        Connect with Google (Sign In)
                                    </a>
                                )}
                            </div>
                            <InputField
                                label="Private Key (Optional if using OAuth)"
                                id="google_private_key"
                                multiline={true}
                                placeholder="-----BEGIN PRIVATE KEY----- ..."
                            />
                            <div className="bg-blue-50 p-3 rounded text-xs text-blue-800">
                                <strong>Note:</strong> For <code>@gmail.com</code> accounts, use the <b>Connect with Google</b> button above. Service Accounts only work with Google Workspace.
                            </div>
                            <InputField
                                label="Impersonate Email (Sender) - Service Account Only"
                                id="gmail_sender_email"
                                placeholder="you@company.com"
                            />
                        </div>
                    </ServiceCard>

                    {/* AI Configuration */}
                    <ServiceCard
                        id="ai_config"
                        title="AI Configuration"
                        icon={Bot}
                        connected={settings.ai_provider === 'openai' ? status.openai : status.ollama}
                        description={settings.ai_provider === 'openai' ? 'Using OpenAI (Cloud)' : 'Using Ollama (Local)'}
                        onSave={() => handleSave('ai')}
                    >
                        <div className="grid gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">AI Provider</label>
                                <select
                                    value={settings.ai_provider}
                                    onChange={e => setSettings({ ...settings, ai_provider: e.target.value })}
                                    className="w-full px-4 py-2 bg-white border border-cream-300 rounded-lg focus:outline-none focus:border-gold-500"
                                >
                                    <option value="ollama">Local (Ollama)</option>
                                    <option value="openai">Cloud (OpenAI)</option>
                                </select>
                            </div>

                            {settings.ai_provider === 'ollama' ? (
                                <>
                                    <InputField
                                        label="Base URL"
                                        id="ollama_base_url"
                                        placeholder="http://localhost:11434"
                                    />
                                    <InputField
                                        label="Model"
                                        id="ollama_model"
                                        placeholder="llama3:8b"
                                    />
                                    {status.ollama && (
                                        <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm mt-2">
                                            ✅ Ollama is running with {status.ollama_models?.length || 0} models available.
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <InputField
                                        label="OpenAI API Key"
                                        id="openai_api_key"
                                        secret={true}
                                        placeholder="sk-..."
                                    />
                                    <InputField
                                        label="OpenAI Model"
                                        id="openai_model"
                                        placeholder="gpt-4o"
                                    />
                                </>
                            )}
                        </div>
                    </ServiceCard>
                </div>
            </main>
        </div>
    )
}
