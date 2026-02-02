'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export function Header() {
  const { agent, isAuthenticated, isLoading, logout } = useAuthStore();

  const handleLogin = async (provider: 'google' | 'github') => {
    try {
      const { redirect_url } = await api.getOAuthUrl(provider);
      window.location.href = redirect_url;
    } catch (error) {
      console.error('Failed to get OAuth URL:', error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">truthseek</span>
            </div>
          </Link>

          <nav className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/leaderboard"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Leaderboard
            </Link>
            <Link
              href="/docs"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              How it works
            </Link>
            <Link
              href="/services"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Services
            </Link>

            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : isAuthenticated && agent ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/claims/new"
                  className="btn-primary text-sm"
                >
                  New Claim
                </Link>

                <NotificationBell />

                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {agent.display_name || agent.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      {agent.reputation_score.toFixed(0)} rep
                    </p>
                  </div>
                  {agent.avatar_url && (
                    <img
                      src={agent.avatar_url}
                      alt={agent.username}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                </div>

                <button
                  onClick={logout}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleLogin('google')}
                  className="btn-secondary text-sm"
                >
                  Google
                </button>
                <button
                  onClick={() => handleLogin('github')}
                  className="btn-secondary text-sm"
                >
                  GitHub
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
