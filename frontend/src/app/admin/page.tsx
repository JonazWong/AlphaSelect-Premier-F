'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Shield, Users, Database, Activity, Settings, Globe,
  Lock, Server, AlertTriangle, CheckCircle, XCircle,
  TrendingUp, BarChart2, RefreshCw, ChevronRight
} from 'lucide-react'
import '@/i18n/config'
import Link from 'next/link'

const mockSystemStatus = [
  { name: 'API Server', status: 'healthy', uptime: '99.9%' },
  { name: 'PostgreSQL', status: 'healthy', uptime: '99.8%' },
  { name: 'Redis Cache', status: 'healthy', uptime: '100%' },
  { name: 'Celery Workers', status: 'warning', uptime: '98.2%' },
  { name: 'Data Crawler', status: 'healthy', uptime: '97.5%' },
  { name: 'WebSocket', status: 'error', uptime: '85.0%' },
]

const mockUsers = [
  { id: 1, name: 'Alice Chen', email: 'alice@example.com', role: 'admin', status: 'active', lastLogin: '2m ago' },
  { id: 2, name: 'Bob Wang', email: 'bob@example.com', role: 'member', status: 'active', lastLogin: '1h ago' },
  { id: 3, name: 'Carol Liu', email: 'carol@example.com', role: 'member', status: 'inactive', lastLogin: '3d ago' },
  { id: 4, name: 'David Zhang', email: 'david@example.com', role: 'viewer', status: 'active', lastLogin: '5m ago' },
]

const adminModules = [
  { href: '/crawler-config', icon: Globe, label: 'Crawler Config', labelZh: '爬蟲配置', color: 'from-cyan-500 to-blue-500', shadow: 'shadow-cyan-500/30' },
  { href: '/blacklist', icon: Lock, label: 'Blacklist', labelZh: '黑名單', color: 'from-red-500 to-orange-500', shadow: 'shadow-red-500/30' },
  { href: '/dashboard', icon: BarChart2, label: 'Member Dashboard', labelZh: '會員儀表板', color: 'from-purple-500 to-pink-500', shadow: 'shadow-purple-500/30' },
  { href: '/ai-training', icon: TrendingUp, label: 'AI Training', labelZh: 'AI 訓練', color: 'from-green-500 to-emerald-500', shadow: 'shadow-green-500/30' },
]

const statusIcon = {
  healthy: <CheckCircle className="w-4 h-4 text-green-400" />,
  warning: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
  error: <XCircle className="w-4 h-4 text-red-400" />,
}

const statusColor = {
  healthy: 'text-green-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
}

export default function AdminPage() {
  const { t } = useTranslation('common')
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'system' | 'settings'>('overview')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center shadow-lg shadow-gray-900/50 border border-gray-600">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-1">
              <span className="text-gradient-cyan-purple">{t('admin.title')}</span>
              <span className="ml-3 text-2xl text-gray-500 font-normal">{t('admin.subtitle')}</span>
            </h1>
            <p className="text-gray-400 text-sm">{t('admin.description')}</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-all">
          <RefreshCw className="w-4 h-4" />
          {t('common.refresh')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm">
            <Users className="w-4 h-4" />
            {t('admin.totalUsers')}
          </div>
          <div className="text-2xl font-bold text-white">{mockUsers.length}</div>
          <div className="text-xs text-green-400 mt-1">+2 {t('admin.thisWeek')}</div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm">
            <Activity className="w-4 h-4" />
            {t('admin.activeServices')}
          </div>
          <div className="text-2xl font-bold text-white">
            {mockSystemStatus.filter((s) => s.status === 'healthy').length}/{mockSystemStatus.length}
          </div>
          <div className="text-xs text-yellow-400 mt-1">
            {mockSystemStatus.filter((s) => s.status !== 'healthy').length} {t('admin.needsAttention')}
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm">
            <Database className="w-4 h-4" />
            {t('admin.dbSize')}
          </div>
          <div className="text-2xl font-bold text-primary">2.4 GB</div>
          <div className="text-xs text-gray-500 mt-1">PostgreSQL 16</div>
        </div>
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-2 text-gray-400 text-sm">
            <Server className="w-4 h-4" />
            {t('admin.uptime')}
          </div>
          <div className="text-2xl font-bold text-green-400">99.2%</div>
          <div className="text-xs text-gray-500 mt-1">30 {t('admin.days')}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {(['overview', 'users', 'system', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {t(`admin.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Module Quick Links */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3">{t('admin.quickAccess')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {adminModules.map((mod) => {
                const Icon = mod.icon
                return (
                  <Link key={mod.href} href={mod.href}>
                    <div className="glass-card p-4 cursor-pointer hover:scale-105 transition-transform flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${mod.color} flex items-center justify-center shadow ${mod.shadow}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{mod.label}</div>
                        <div className="text-xs text-gray-500">{mod.labelZh}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600 ml-auto" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* System Overview */}
          <div className="glass-card p-5">
            <h3 className="font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" />
              {t('admin.systemStatus')}
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {mockSystemStatus.map((svc) => (
                <div key={svc.name} className="flex items-center justify-between p-3 rounded-lg bg-card border border-gray-800">
                  <div className="flex items-center gap-2">
                    {statusIcon[svc.status as keyof typeof statusIcon]}
                    <span className="text-sm font-medium text-white">{svc.name}</span>
                  </div>
                  <span className={`text-xs font-mono ${statusColor[svc.status as keyof typeof statusColor]}`}>{svc.uptime}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-700/50 flex items-center justify-between">
            <span className="text-sm text-gray-400">{mockUsers.length} {t('admin.users')}</span>
            <button className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
              <Users className="w-3 h-3" />
              {t('admin.inviteUser')}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{t('admin.userName')}</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium">Email</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-500 font-medium">{t('admin.role')}</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-500 font-medium">{t('admin.status')}</th>
                  <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium">{t('admin.lastLogin')}</th>
                </tr>
              </thead>
              <tbody>
                {mockUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-800/50 hover:bg-card/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{user.name}</td>
                    <td className="px-4 py-3 text-gray-400">{user.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium border ${
                        user.role === 'admin'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : user.role === 'member'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>{user.role}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        user.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-500'
                      }`}>{user.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 text-xs">{user.lastLogin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* System Tab */}
      {activeTab === 'system' && (
        <div className="space-y-4">
          {mockSystemStatus.map((svc) => (
            <div key={svc.name} className="glass-card p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-10 rounded-full ${
                  svc.status === 'healthy' ? 'bg-green-500' :
                  svc.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <div>
                  <div className="font-medium text-white">{svc.name}</div>
                  <div className={`text-xs mt-0.5 flex items-center gap-1 ${statusColor[svc.status as keyof typeof statusColor]}`}>
                    {statusIcon[svc.status as keyof typeof statusIcon]}
                    {t(`admin.statusValues.${svc.status}`)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold font-mono text-white">{svc.uptime}</div>
                <div className="text-xs text-gray-500">{t('admin.uptime')}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              {t('admin.platformSettings')}
            </h3>
            <div className="space-y-4">
              {[
                { label: t('admin.settings.maintenanceMode'), description: t('admin.settings.maintenanceModeDesc') },
                { label: t('admin.settings.debugLogging'), description: t('admin.settings.debugLoggingDesc') },
                { label: t('admin.settings.publicRegistration'), description: t('admin.settings.publicRegistrationDesc') },
              ].map((setting, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-gray-800/50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-white">{setting.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{setting.description}</div>
                  </div>
                  <button className="relative w-10 h-5 rounded-full bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40">
                    <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
