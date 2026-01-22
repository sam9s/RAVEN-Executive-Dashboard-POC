'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import {
  Calendar, DollarSign, FolderKanban,
  Send, Bot, TrendingUp, RefreshCw,
  AlertCircle, CheckCircle, Clock, ArrowRight, Users, LayoutDashboard
} from 'lucide-react'
import { formatCurrency, formatDate, formatTime, getStatusColor, getHealthColor, getDaysOverdue } from '@/lib/utils'

interface DashboardStats {
  active_leads: number
  active_projects: number
  avg_health: number
  overdue_invoices: number
  overdue_amount: number
  pipeline_value: number
  upcoming_meetings: number
  monthly_time_saved: number
  total_clients: number
  overdue_projects: number
}

interface Project {
  id: string
  name: string
  status: string
  budget: number
  spent: number
  health_score: number
  due_date: string | null
}

interface Invoice {
  id: string
  invoice_number: string
  amount: number
  status: string
  due_date: string
  clients?: { name: string; email: string }
}

interface CalendarEvent {
  id: string
  title: string
  start_time: string
  end_time: string
  location?: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [aiProvider, setAiProvider] = useState<string>('ollama')
  // Navigation now uses separate pages via Header component

  // Load chat from localStorage on mount
  useEffect(() => {
    const savedChat = localStorage.getItem('ai_chat_history')
    if (savedChat) {
      try {
        setChatMessages(JSON.parse(savedChat))
      } catch (e) {
        console.error('Failed to parse saved chat:', e)
      }
    }
  }, [])

  // Save chat to localStorage whenever it changes
  useEffect(() => {
    if (chatMessages.length > 0) {
      localStorage.setItem('ai_chat_history', JSON.stringify(chatMessages))
    }
  }, [chatMessages])

  // Clear chat function
  const handleClearChat = () => {
    setChatMessages([])
    localStorage.removeItem('ai_chat_history')
  }

  // Fetch all data
  const fetchData = async () => {
    try {
      const [statsRes, projectsRes, invoicesRes, eventsRes] = await Promise.all([
        fetch('/api/health', { cache: 'no-store' }),
        fetch('/api/projects', { cache: 'no-store' }),
        fetch('/api/invoices', { cache: 'no-store' }),
        fetch('/api/calendar/events', { cache: 'no-store' })
      ])

      const statsData = await statsRes.json()
      const projectsData = await projectsRes.json()
      const invoicesData = await invoicesRes.json()
      const eventsData = await eventsRes.json()

      if (statsData.stats) setStats(statsData.stats)
      if (statsData.services?.ai_provider) setAiProvider(statsData.services.ai_provider)
      if (projectsData.projects) setProjects(projectsData.projects)
      if (invoicesData.invoices) setInvoices(invoicesData.invoices)
      if (eventsData.events) setEvents(eventsData.events)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  // Sync all integrations
  const handleSync = async () => {
    setSyncing(true)
    try {
      await Promise.all([
        fetch('/api/clickup/sync', { method: 'POST' }),
        fetch('/api/calendar/sync', { method: 'POST' })
      ])
      await fetchData()
    } catch (error) {
      console.error('Sync error:', error)
    } finally {
      setSyncing(false)
    }
  }

  // Send invoice reminders
  const handleSendReminders = async () => {
    try {
      const res = await fetch('/api/gmail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'invoice_reminders' })
      })
      const data = await res.json()
      alert(data.success ? `Sent ${data.sent} reminders` : `Error: ${data.error}`)
    } catch (error) {
      alert('Failed to send reminders')
    }
  }

  // Handle Provider Toggle
  const handleToggleProvider = async (provider: string) => {
    setAiProvider(provider)
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: { ai_provider: provider }
        })
      })
    } catch (error) {
      console.error('Failed to update AI provider:', error)
    }
  }

  // Chat with AI
  const handleChat = async () => {
    if (!chatInput.trim()) return

    const userMessage = chatInput
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setChatLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, { role: 'user', content: userMessage }],
          provider: aiProvider
        })
      })
      const data = await res.json()

      if (data.response) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.error || 'Sorry, I encountered an error.' }])
      }
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Failed to connect to AI assistant.' }])
    } finally {
      setChatLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-navy-800/50 rounded-full blur-3xl" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Logo with Glow */}
          <div className="loading-logo">
            <LayoutDashboard className="w-10 h-10 text-navy-900" />
          </div>

          {/* Spinner */}
          <div className="loading-spinner">
            <svg viewBox="0 0 50 50">
              <circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                strokeWidth="3"
              />
            </svg>
          </div>

          {/* Text with Dots */}
          <div className="loading-text">
            Loading
            <span className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mt-8 w-48 h-1 bg-navy-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-gold-400 via-gold-500 to-gold-400 rounded-full animate-shimmer"
              style={{ width: '100%', backgroundSize: '200% 100%' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-mesh">
      <Header
        onSync={handleSync}
        syncing={syncing}
        overdueCount={stats?.overdue_invoices || 0}
        overdueProjects={stats?.overdue_projects || 0}
      />

      <main className="max-w-7xl mx-auto px-4 py-8 animate-page-load">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stat-card animate-fade-in" style={{ animationDelay: '0ms' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Total Clients</p>
                <p className="stat-value">{stats?.total_clients || 0}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="stat-card animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Active Projects</p>
                <div className="flex items-baseline gap-2">
                  <p className="stat-value">{stats?.active_projects || 0}</p>
                  {stats && stats.overdue_projects > 0 && (
                    <span className="text-sm font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      {stats.overdue_projects} Overdue
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Avg Health: {Math.round(stats?.avg_health || 0)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="stat-card animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Overdue Invoices</p>
                <p className="stat-value text-red-600">{formatCurrency(stats?.overdue_amount || 0)}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats?.overdue_invoices || 0} invoices
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="stat-card animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="stat-label">Upcoming Meetings</p>
                <p className="stat-value">{stats?.upcoming_meetings || 0}</p>
                <p className="text-sm text-gray-500 mt-1">This week</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects */}
          <div className="lg:col-span-2 card-premium">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-navy-900">Active Projects</h2>
              <button className="text-sm text-gold-600 hover:text-gold-700 flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {projects.slice(0, 5).map(project => {
                const isOverdue = project.due_date &&
                  project.status === 'active' &&
                  new Date(project.due_date) < new Date(new Date().setHours(0, 0, 0, 0))

                return (
                  <div key={project.id} className={`flex items-center gap-4 p-4 bg-cream-50 rounded-xl border ${isOverdue ? 'border-red-200 shadow-sm' : 'border-transparent'}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-navy-900">{project.name}</h3>
                        {isOverdue && (
                          <span className="text-[10px] uppercase tracking-wider font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Overdue
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatCurrency(project.spent)} / {formatCurrency(project.budget)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-medium px-3 py-1 rounded-full ${getHealthColor(project.health_score)}`}>
                        {project.health_score}%
                      </span>
                      {project.due_date && (
                        <p className={`text-xs mt-1 ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                          Due: {formatDate(project.due_date)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
              {projects.length === 0 && (
                <p className="text-center text-gray-500 py-8">No projects found. Sync with ClickUp to import tasks.</p>
              )}
            </div>
          </div>

          {/* Calendar Events */}
          <div className="card-premium">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-navy-900">Upcoming Events</h2>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {events.slice(0, 5).map(event => (
                <div key={event.id} className="p-3 bg-cream-50 rounded-xl">
                  <h3 className="font-medium text-navy-900 text-sm">{event.title}</h3>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatDate(event.start_time)} at {formatTime(event.start_time)}
                  </div>
                  {event.location && (
                    <p className="text-xs text-gray-400 mt-1">{event.location}</p>
                  )}
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-center text-gray-500 py-4 text-sm">No upcoming events</p>
              )}
            </div>
          </div>

          {/* Overdue Invoices */}
          <div className="card-premium">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-navy-900">Overdue Invoices</h2>
              <button
                onClick={handleSendReminders}
                className="btn-primary text-sm flex items-center gap-1"
              >
                <Send className="w-4 h-4" />
                Send Reminders
              </button>
            </div>
            <div className="space-y-3">
              {invoices.filter(i => i.status === 'overdue').slice(0, 5).map(invoice => (
                <div key={invoice.id} className="p-3 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-navy-900">{invoice.invoice_number}</span>
                    <span className="font-semibold text-red-600">{formatCurrency(invoice.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-gray-500">{invoice.clients?.name || 'Unknown'}</span>
                    <span className="text-red-500">{getDaysOverdue(invoice.due_date)} days overdue</span>
                  </div>
                </div>
              ))}
              {invoices.filter(i => i.status === 'overdue').length === 0 && (
                <div className="text-center py-4">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                  <p className="text-sm text-gray-500 mt-2">No overdue invoices!</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Assistant */}
          <div className="lg:col-span-2 card-dark">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gold-500 rounded-xl flex items-center justify-center">
                  <Bot className="w-5 h-5 text-navy-900" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">AI Assistant</h2>
                  <p className="text-sm text-cream-300">Ask about your data or tasks</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {chatMessages.length > 0 && (
                  <button
                    onClick={handleClearChat}
                    className="text-xs text-cream-400 hover:text-cream-100 px-2 py-1 border border-navy-700 rounded-lg hover:border-gold-500 transition-colors"
                    title="Clear chat history"
                  >
                    Clear
                  </button>
                )}
                {chatMessages.length > 0 && (
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    Saved
                  </span>
                )}
                <select
                  value={aiProvider}
                  onChange={(e) => handleToggleProvider(e.target.value)}
                  className="bg-navy-800 text-xs border border-navy-700 rounded-lg px-2 py-1 text-cream-100 outline-none focus:border-gold-500 cursor-pointer"
                >
                  <option value="ollama">Local (Ollama)</option>
                  <option value="openai">Cloud (OpenAI)</option>
                </select>
                <div className={`w-2 h-2 rounded-full ${aiProvider === 'openai' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-blue-400'}`} />
              </div>
            </div>

            {/* Chat Messages */}
            <div className="bg-navy-800 rounded-xl p-4 h-64 overflow-y-auto mb-4">
              {chatMessages.length === 0 ? (
                <div className="text-center text-cream-300 py-8">
                  <p>Try asking:</p>
                  <div className="flex flex-wrap gap-2 justify-center mt-3">
                    {['Show my projects', 'Get Gmail summary', 'Email invoice'].map(q => (
                      <button
                        key={q}
                        onClick={() => { setChatInput(q); }}
                        className="text-xs bg-navy-900 px-3 py-1 rounded-full hover:bg-gold-500 hover:text-navy-900 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-2 rounded-xl text-sm ${msg.role === 'user'
                          ? 'bg-gold-500 text-navy-900'
                          : 'bg-navy-900 text-cream-100'
                          }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-navy-900 px-4 py-2 rounded-xl">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gold-500 rounded-full animate-bounce" />
                          <span className="w-2 h-2 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <span className="w-2 h-2 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                placeholder="Ask anything about your business..."
                className="flex-1 bg-navy-800 border border-navy-800 rounded-xl px-4 py-3 text-cream-100 placeholder-cream-300 focus:outline-none focus:border-gold-500"
              />
              <button
                onClick={handleChat}
                disabled={chatLoading || !chatInput.trim()}
                className="btn-primary px-6"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ROI Section */}
        <div className="mt-8 card-premium">
          <h2 className="text-lg font-semibold text-navy-900 mb-6">Automation ROI</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-cream-50 rounded-xl">
              <p className="text-4xl font-bold text-gold-500">{(stats?.monthly_time_saved || 0).toFixed(1)}h</p>
              <p className="text-sm text-gray-500 mt-2">Time Saved This Month</p>
            </div>
            <div className="text-center p-6 bg-cream-50 rounded-xl">
              <p className="text-4xl font-bold text-green-600">{formatCurrency((stats?.monthly_time_saved || 0) * 50)}</p>
              <p className="text-sm text-gray-500 mt-2">Cost Savings (@ $50/hr)</p>
            </div>
            <div className="text-center p-6 bg-cream-50 rounded-xl">
              <p className="text-4xl font-bold text-blue-600">{projects.length + events.length}</p>
              <p className="text-sm text-gray-500 mt-2">Items Synced</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
