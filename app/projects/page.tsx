'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import { RefreshCw, Plus, Search, FolderKanban, Calendar, DollarSign, TrendingUp, X, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor, getHealthColor } from '@/lib/utils'

interface Project {
    id: string
    name: string
    status: string
    budget: number
    spent: number
    health_score: number
    start_date: string | null
    due_date: string | null
    notes: string | null
    clickup_task_id: string | null
}

interface ClickUpList {
    id: string
    name: string
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [syncing, setSyncing] = useState(false)
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [lists, setLists] = useState<ClickUpList[]>([])
    const [createForm, setCreateForm] = useState({ name: '', description: '', list_id: '', due_date: '' })
    const [creating, setCreating] = useState(false)

    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/projects')
            const data = await res.json()
            if (data.projects) setProjects(data.projects)
        } catch (error) {
            console.error('Error fetching projects:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchLists = async () => {
        try {
            const res = await fetch('/api/clickup/lists')
            const data = await res.json()
            if (data.success && data.lists) {
                setLists(data.lists)
                if (data.lists.length > 0) setCreateForm(prev => ({ ...prev, list_id: data.lists[0].id }))
            }
        } catch (error) {
            console.error('Error fetching lists:', error)
        }
    }

    useEffect(() => {
        fetchProjects()
        fetchLists()
        const interval = setInterval(fetchProjects, 10000)
        return () => clearInterval(interval)
    }, [])

    const handleSync = async () => {
        setSyncing(true)
        try {
            await fetch('/api/clickup/sync', { method: 'POST' })
            await fetchProjects()
        } catch (error) {
            console.error('Sync error:', error)
        } finally {
            setSyncing(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)
        try {
            const res = await fetch('/api/clickup/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createForm)
            })
            const data = await res.json()
            if (data.success) {
                alert('Project created in ClickUp! Syncing now...')
                setShowCreateModal(false)
                setCreateForm({ name: '', description: '', list_id: lists[0]?.id || '', due_date: '' })
                await handleSync()
            } else {
                alert('Error creating project: ' + data.error)
            }
        } catch (error) {
            console.error('Create error:', error)
            alert('Failed to create project')
        } finally {
            setCreating(false)
        }
    }

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm('Are you sure you want to delete this project?')) return
        try {
            const res = await fetch(`/api/projects?id=${id}`, { method: 'DELETE' })
            if (res.ok) setProjects(projects.filter(p => p.id !== id))
            else alert('Failed to delete project')
        } catch (error) {
            console.error('Delete error:', error)
        }
    }

    const filteredProjects = projects.filter(p => {
        const matchesFilter = filter === 'all' || p.status === filter
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
        return matchesFilter && matchesSearch
    })

    const stats = {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        avgHealth: projects.length > 0 ? Math.round(projects.reduce((acc, p) => acc + p.health_score, 0) / projects.length) : 0,
        totalBudget: projects.reduce((acc, p) => acc + p.budget, 0)
    }

    const overdueProjects = projects.filter(p => p.status === 'active' && p.due_date && new Date(p.due_date) < new Date(new Date().setHours(0, 0, 0, 0))).length

    if (loading) {
        return (
            <div className="min-h-screen bg-cream-100">
                <Header onSync={handleSync} syncing={syncing} />
                <div className="flex items-center justify-center h-96">
                    <RefreshCw className="w-8 h-8 animate-spin text-gold-500" />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-cream-100">
            <Header onSync={handleSync} syncing={syncing} overdueProjects={overdueProjects} />
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-navy-900">Projects</h1>
                        <p className="text-gray-500 mt-1">Manage and track all your projects</p>
                    </div>
                    <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
                        <Plus className="w-4 h-4" /> New Project
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="stat-card"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><FolderKanban className="w-5 h-5 text-blue-600" /></div><div><p className="text-2xl font-bold text-navy-900">{stats.total}</p><p className="text-sm text-gray-500">Total Projects</p></div></div></div>
                    <div className="stat-card"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><TrendingUp className="w-5 h-5 text-green-600" /></div><div><p className="text-2xl font-bold text-navy-900">{stats.active}</p><p className="text-sm text-gray-500">Active</p></div></div></div>
                    <div className="stat-card"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><Calendar className="w-5 h-5 text-purple-600" /></div><div><p className="text-2xl font-bold text-navy-900">{stats.avgHealth}%</p><p className="text-sm text-gray-500">Avg Health</p></div></div></div>
                    <div className="stat-card"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center"><DollarSign className="w-5 h-5 text-gold-600" /></div><div><p className="text-2xl font-bold text-navy-900">{formatCurrency(stats.totalBudget)}</p><p className="text-sm text-gray-500">Total Budget</p></div></div></div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-cream-300 focus:outline-none focus:border-gold-500" />
                    </div>
                    <div className="flex gap-2">
                        {['all', 'planning', 'active', 'on_hold', 'completed'].map(status => (
                            <button key={status} onClick={() => setFilter(status)} className={`px-4 py-2 rounded-lg transition-colors capitalize ${filter === status ? 'bg-gold-500 text-navy-900' : 'bg-cream-200 text-gray-600 hover:bg-cream-300'}`}>{status.replace('_', ' ')}</button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map(project => (
                        <div key={project.id} className="card-premium hover:shadow-card-hover transition-shadow cursor-pointer relative">
                            <button onClick={(e) => handleDelete(project.id, e)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            <div className="flex items-start justify-between mb-4 pr-8">
                                <h3 className="font-semibold text-navy-900 text-lg">{project.name}</h3>
                                <span className={`text-sm font-medium px-3 py-1 rounded-full ${getHealthColor(project.health_score)}`}>{project.health_score}%</span>
                            </div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>{project.status}</span>
                                {project.clickup_task_id && <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">ClickUp</span>}
                            </div>
                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-1"><span className="text-gray-500">Budget</span><span className="font-medium">{formatCurrency(project.spent)} / {formatCurrency(project.budget)}</span></div>
                                <div className="h-2 bg-cream-200 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${(project.spent / project.budget) > 0.9 ? 'bg-red-500' : 'bg-gold-500'}`} style={{ width: `${Math.min((project.spent / project.budget) * 100, 100)}%` }} /></div>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                                {project.start_date && <span>Start: {formatDate(project.start_date)}</span>}
                                {project.due_date && <span>Due: {formatDate(project.due_date)}</span>}
                            </div>
                        </div>
                    ))}
                </div>

                {filteredProjects.length === 0 && (
                    <div className="text-center py-16">
                        <FolderKanban className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 mb-2">No projects found</h3>
                        <p className="text-gray-400">Click "Sync All" to import projects from ClickUp</p>
                    </div>
                )}

                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-navy-900">Create New Project</h2>
                                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                            </div>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label><input type="text" required value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-cream-300 focus:outline-none focus:border-gold-500" placeholder="e.g. Website Redesign" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Target List</label><select required value={createForm.list_id} onChange={(e) => setCreateForm({ ...createForm, list_id: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-cream-300 focus:outline-none focus:border-gold-500"><option value="">Select a ClickUp List...</option>{lists.map(list => (<option key={list.id} value={list.id}>{list.name}</option>))}</select></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label><input type="date" value={createForm.due_date} onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-cream-300 focus:outline-none focus:border-gold-500" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea rows={3} value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-cream-300 focus:outline-none focus:border-gold-500" /></div>
                                <div className="flex justify-end gap-3 mt-6"><button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={creating} className="btn-primary">{creating ? 'Creating...' : 'Create in ClickUp'}</button></div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
