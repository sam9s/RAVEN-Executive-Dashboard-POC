'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Calendar, DollarSign, FolderKanban,
  Bell, Settings, RefreshCw, Mail, AlertCircle, X
} from 'lucide-react'

interface HeaderProps {
  overdueCount?: number
  overdueProjects?: number
  onSync?: () => void
  syncing?: boolean
}

export default function Header({ overdueCount = 0, overdueProjects = 0, onSync, syncing = false }: HeaderProps) {
  const pathname = usePathname()
  const [showNotifications, setShowNotifications] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  const totalNotifications = overdueCount + overdueProjects

  const navItems = [
    { id: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', href: '/projects', label: 'Projects', icon: FolderKanban },
    { id: 'calendar', href: '/calendar', label: 'Calendar', icon: Calendar },
    { id: 'invoices', href: '/invoices', label: 'Invoices', icon: DollarSign },
    { id: 'email', href: '/email', label: 'Email', icon: Mail },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <header className="header-glass sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-11 h-11 bg-gradient-to-br from-gold-400 to-gold-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
            <LayoutDashboard className="w-5 h-5 text-navy-900" />
          </div>
          <span className="text-xl font-bold text-navy-900 tracking-tight">Executive Dashboard</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-cream-200 rounded-xl p-1">
          {navItems.map(item => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive(item.href)
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-gray-600 hover:text-navy-900'
                }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {onSync && (
            <button
              onClick={onSync}
              disabled={syncing}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync All'}
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 hover:bg-cream-200 rounded-lg relative ${showNotifications ? 'bg-cream-200' : ''}`}
            >
              <Bell className="w-5 h-5" />
              {totalNotifications > 0 && !isDismissed && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {totalNotifications}
                </span>
              )}
            </button>

            {
              showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-cream-200 p-4 z-50 animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-navy-900">Notifications</h3>
                      <div className="flex items-center gap-2">
                        {totalNotifications > 0 && !isDismissed && (
                          <button
                            onClick={() => setIsDismissed(true)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                          >
                            Clear all
                          </button>
                        )}
                        <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {totalNotifications > 0 && !isDismissed ? (
                      <div className="space-y-3">
                        {overdueCount > 0 && (
                          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-navy-900">Overdue Invoices</p>
                              <p className="text-xs text-red-600 mt-1">You have {overdueCount} overdue invoice(s).</p>
                              <Link
                                href="/invoices"
                                onClick={() => setShowNotifications(false)}
                                className="text-xs text-blue-600 hover:underline mt-2 block"
                              >
                                View Invoices
                              </Link>
                            </div>
                          </div>
                        )}

                        {overdueProjects > 0 && (
                          <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                            <FolderKanban className="w-5 h-5 text-orange-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-navy-900">Overdue Projects</p>
                              <p className="text-xs text-orange-600 mt-1">You have {overdueProjects} project(s) past due.</p>
                              <Link
                                href="/projects"
                                onClick={() => setShowNotifications(false)}
                                className="text-xs text-blue-600 hover:underline mt-2 block"
                              >
                                View Projects
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No new notifications</p>
                      </div>
                    )}
                  </div>
                </>
              )
            }
          </div >

          <Link href="/settings" className="p-2 hover:bg-cream-200 rounded-lg text-gray-600 hover:text-navy-900 transition-colors" title="Settings">
            <Settings className="w-5 h-5" />
          </Link>
        </div >
      </div >
    </header >
  )
}
