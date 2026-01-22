import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { clickupClient } from '@/lib/integrations/clickup'
import { googleCalendarClient } from '@/lib/integrations/google-calendar'
import { ollamaClient } from '@/lib/ai/ollama'
import { openaiClient } from '@/lib/ai/openai'

export async function GET() {
  try {
    // Fetch AI settings from DB
    const { data: dbSettings } = await supabase.from('settings').select('*')
    const config: Record<string, string> = {}
    dbSettings?.forEach((s: any) => config[s.key] = s.value)

    const provider = config['ai_provider'] || process.env.AI_PROVIDER || 'ollama'
    const openAIKey = config['openai_api_key'] || process.env.OPENAI_API_KEY
    const openAIModel = config['openai_model'] || process.env.OPENAI_MODEL || 'gpt-4o'

    // Check all services
    const [clickupStatus, calendarStatus, ollamaStatus] = await Promise.all([
      clickupClient.testConnection(),
      googleCalendarClient.testConnection(),
      ollamaClient.testConnection()
    ])

    // Test OpenAI if selected
    let openaiConnected = false
    if (provider === 'openai' && openAIKey) {
      const test = await openaiClient.testConnection(openAIKey)
      openaiConnected = test.success
    }

    // Calculate stats dynamically from tables to ensure real-time accuracy
    // Use local date for accurate overdue calculation
    const today = new Date().toLocaleDateString('en-CA')

    const activeProjectsPromise = supabase
      .from('projects')
      .select('health_score', { count: 'exact' })
      .eq('status', 'active')

    const overdueProjectsPromise = supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .lt('due_date', today)

    const overdueInvoicesPromise = supabase
      .from('invoices')
      .select('amount', { count: 'exact' })
      .or(`status.eq.overdue,and(status.eq.sent,due_date.lt.${today})`)

    const activeLeadsPromise = supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .in('status', ['lead', 'qualified'])

    // Total Clients Count
    const totalClientsPromise = supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })

    const pipelineValuePromise = supabase
      .from('clients') // Use clients for pipeline value (estimated_value)
      .select('estimated_value')
      .in('status', ['lead', 'qualified', 'proposal'])

    const upcomingMeetingsPromise = supabase
      .from('calendar_events')
      .select('id', { count: 'exact', head: true })
      .gte('start_time', new Date().toISOString())
      .lte('start_time', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()) // Next 7 days

    const roiPromise = supabase
      .from('roi_metrics')
      .select('time_saved_hours')
      .gte('metric_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const [
      { data: activeProjects, count: activeProjectsCount },
      { count: overdueProjectsCount },
      { data: overdueInvoices, count: overdueInvoicesCount },
      { count: activeLeadsCount },
      { count: totalClientsCount },
      { data: pipelineClients },
      { count: upcomingMeetingsCount },
      { data: roiMetrics }
    ] = await Promise.all([
      activeProjectsPromise,
      overdueProjectsPromise,
      overdueInvoicesPromise,
      activeLeadsPromise,
      totalClientsPromise,
      pipelineValuePromise,
      upcomingMeetingsPromise,
      roiPromise
    ])

    // Aggregations
    const avg_health = activeProjects?.length
      ? activeProjects.reduce((sum, p) => sum + (p.health_score || 0), 0) / activeProjects.length
      : 0

    const overdue_amount = overdueInvoices
      ? overdueInvoices.reduce((sum, i) => sum + (i.amount || 0), 0)
      : 0

    const pipeline_value = pipelineClients
      ? pipelineClients.reduce((sum, c) => sum + (c.estimated_value || 0), 0)
      : 0

    const monthly_time_saved = roiMetrics
      ? roiMetrics.reduce((sum, m) => sum + (m.time_saved_hours || 0), 0)
      : 0

    const stats = {
      active_leads: activeLeadsCount || 0,
      total_clients: totalClientsCount || 0,
      active_projects: activeProjectsCount || 0,
      overdue_projects: overdueProjectsCount || 0,
      avg_health: Math.round(avg_health),
      overdue_invoices: overdueInvoicesCount || 0,
      overdue_amount,
      pipeline_value,
      upcoming_meetings: upcomingMeetingsCount || 0,
      monthly_time_saved
    }

    return NextResponse.json({
      success: true,
      services: {
        supabase: true,
        clickup: clickupStatus.success,
        calendar: calendarStatus.success,
        ollama: ollamaStatus.success,
        ollama_models: ollamaStatus.models || [],
        ai_provider: provider,
        openai_model: openAIModel,
        openai: openaiConnected,
        has_openai_key: !!openAIKey
      },
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Health API Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
