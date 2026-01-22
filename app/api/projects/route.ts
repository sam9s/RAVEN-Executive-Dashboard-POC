import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: projects, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      projects: projects || [],
      count: projects?.length || 0
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, client_id, status, budget, start_date, due_date, notes } = body

    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'Project name is required'
      }, { status: 400 })
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name,
        client_id: client_id || null,
        status: status || 'planning',
        budget: budget || 0,
        start_date: start_date || null,
        due_date: due_date || null,
        notes: notes || null,
        health_score: 100
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      project
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
