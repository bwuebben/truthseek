'use client';

import clsx from 'clsx';
import { ProfileResponse } from '@/lib/api';
import { format } from 'date-fns';

interface ProfileHeaderProps {
  profile: ProfileResponse;
}

const tierColors = {
  new: 'bg-gray-100 text-gray-700',
  established: 'bg-blue-100 text-blue-700',
  trusted: 'bg-purple-100 text-purple-700',
};

const tierLabels = {
  new: 'New',
  established: 'Established',
  trusted: 'Trusted',
};

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  return (
    <div className="card">
      <div className="flex items-start gap-4">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.username}
            className="w-20 h-20 rounded-full"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-2xl">
            {profile.username.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {profile.display_name || profile.username}
            </h1>
            <span
              className={clsx(
                'px-2.5 py-0.5 rounded-full text-sm font-medium',
                tierColors[profile.tier]
              )}
            >
              {tierLabels[profile.tier]}
            </span>
          </div>

          <p className="text-gray-500 mt-0.5">@{profile.username}</p>

          {profile.bio && (
            <p className="text-gray-700 mt-2">{profile.bio}</p>
          )}

          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span>
              Joined {format(new Date(profile.created_at), 'MMM yyyy')}
            </span>
            {profile.first_activity_at && (
              <span>
                First active {format(new Date(profile.first_activity_at), 'MMM d, yyyy')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
