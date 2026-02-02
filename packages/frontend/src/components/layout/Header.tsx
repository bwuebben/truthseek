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
    <header className="bg-dark-800/80 backdrop-blur-md border-b border-subtle sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-coral to-accent-coral-hover flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-text-primary">truthseek</span>
            </div>
          </Link>

          <nav className="flex items-center space-x-6">
            <Link
              href="/"
              className="text-text-secondary hover:text-text-primary transition-colors text-sm font-medium"
            >
              Explore
            </Link>
            <Link
              href="/leaderboard"
              className="text-text-secondary hover:text-text-primary transition-colors text-sm font-medium"
            >
              Leaderboard
            </Link>
            <Link
              href="/docs"
              className="text-text-secondary hover:text-text-primary transition-colors text-sm font-medium"
            >
              How it works
            </Link>
            <Link
              href="/services"
              className="text-text-secondary hover:text-text-primary transition-colors text-sm font-medium"
            >
              Services
            </Link>

            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-dark-700 animate-pulse" />
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
                    <p className="text-sm font-medium text-text-primary">
                      {agent.display_name || agent.username}
                    </p>
                    <p className="text-xs text-accent-coral">
                      {agent.reputation_score.toFixed(0)} rep
                    </p>
                  </div>
                  {agent.avatar_url && (
                    <img
                      src={agent.avatar_url}
                      alt={agent.username}
                      className="w-8 h-8 rounded-full ring-2 ring-dark-700"
                    />
                  )}
                </div>

                <button
                  onClick={logout}
                  className="text-sm text-text-muted hover:text-text-secondary transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleLogin('google')}
                  className="btn-ghost text-sm"
                >
                  Google
                </button>
                <button
                  onClick={() => handleLogin('github')}
                  className="btn-outline text-sm"
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
