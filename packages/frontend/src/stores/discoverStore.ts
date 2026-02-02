import { create } from 'zustand';
import {
  api,
  TrendingClaim,
  TopicInfo,
  RelatedClaim,
  RecommendedClaim,
  ActivityItem,
  PlatformStats,
  Claim,
} from '@/lib/api';

interface DiscoverState {
  // Trending
  trendingClaims: TrendingClaim[];
  trendingUpdatedAt: string | null;
  isLoadingTrending: boolean;

  // Topics
  topics: TopicInfo[];
  isLoadingTopics: boolean;

  // Recommended
  recommendedClaims: RecommendedClaim[];
  recommendedBasedOn: string[];
  isLoadingRecommended: boolean;

  // Related
  relatedClaims: RelatedClaim[];
  relatedSourceClaimId: string | null;
  isLoadingRelated: boolean;

  // Activity Feed
  activityItems: ActivityItem[];
  activityHasMore: boolean;
  isLoadingActivity: boolean;

  // Platform Stats
  platformStats: PlatformStats | null;
  isLoadingStats: boolean;

  // Bookmarks & Following
  bookmarkedClaims: Claim[];
  bookmarkedTotal: number;
  followedClaims: Claim[];
  followedTotal: number;
  isLoadingBookmarks: boolean;
  isLoadingFollowed: boolean;

  // Bookmark/Follow status tracking (for quick lookups)
  bookmarkedClaimIds: Set<string>;
  followedClaimIds: Set<string>;

  // Actions
  fetchTrendingClaims: (limit?: number) => Promise<void>;
  fetchTopics: (limit?: number) => Promise<void>;
  fetchRecommendedClaims: (limit?: number) => Promise<void>;
  fetchRelatedClaims: (claimId: string, limit?: number) => Promise<void>;
  fetchActivityFeed: (limit?: number, offset?: number) => Promise<void>;
  fetchPlatformStats: () => Promise<void>;
  fetchBookmarkedClaims: (limit?: number, offset?: number) => Promise<void>;
  fetchFollowedClaims: (limit?: number, offset?: number) => Promise<void>;
  toggleBookmark: (claimId: string) => Promise<boolean>;
  toggleFollow: (claimId: string) => Promise<boolean>;
  isBookmarked: (claimId: string) => boolean;
  isFollowing: (claimId: string) => boolean;
  reset: () => void;
}

export const useDiscoverStore = create<DiscoverState>((set, get) => ({
  // Initial state
  trendingClaims: [],
  trendingUpdatedAt: null,
  isLoadingTrending: false,

  topics: [],
  isLoadingTopics: false,

  recommendedClaims: [],
  recommendedBasedOn: [],
  isLoadingRecommended: false,

  relatedClaims: [],
  relatedSourceClaimId: null,
  isLoadingRelated: false,

  activityItems: [],
  activityHasMore: false,
  isLoadingActivity: false,

  platformStats: null,
  isLoadingStats: false,

  bookmarkedClaims: [],
  bookmarkedTotal: 0,
  followedClaims: [],
  followedTotal: 0,
  isLoadingBookmarks: false,
  isLoadingFollowed: false,

  bookmarkedClaimIds: new Set(),
  followedClaimIds: new Set(),

  // Actions
  fetchTrendingClaims: async (limit = 10) => {
    set({ isLoadingTrending: true });
    try {
      const response = await api.getTrendingClaims(limit);
      set({
        trendingClaims: response.claims,
        trendingUpdatedAt: response.updated_at,
        isLoadingTrending: false,
      });
    } catch (error) {
      set({ isLoadingTrending: false });
      throw error;
    }
  },

  fetchTopics: async (limit = 50) => {
    set({ isLoadingTopics: true });
    try {
      const response = await api.getTopics(limit);
      set({
        topics: response.topics,
        isLoadingTopics: false,
      });
    } catch (error) {
      set({ isLoadingTopics: false });
      throw error;
    }
  },

  fetchRecommendedClaims: async (limit = 10) => {
    set({ isLoadingRecommended: true });
    try {
      const response = await api.getRecommendedClaims(limit);
      set({
        recommendedClaims: response.claims,
        recommendedBasedOn: response.based_on_tags,
        isLoadingRecommended: false,
      });
    } catch (error) {
      set({ isLoadingRecommended: false });
      throw error;
    }
  },

  fetchRelatedClaims: async (claimId: string, limit = 5) => {
    set({ isLoadingRelated: true, relatedSourceClaimId: claimId });
    try {
      const response = await api.getRelatedClaims(claimId, limit);
      set({
        relatedClaims: response.related,
        isLoadingRelated: false,
      });
    } catch (error) {
      set({ isLoadingRelated: false });
      throw error;
    }
  },

  fetchActivityFeed: async (limit = 20, offset = 0) => {
    set({ isLoadingActivity: true });
    try {
      const response = await api.getActivityFeed(limit, offset);
      set({
        activityItems: offset === 0 ? response.items : [...get().activityItems, ...response.items],
        activityHasMore: response.has_more,
        isLoadingActivity: false,
      });
    } catch (error) {
      set({ isLoadingActivity: false });
      throw error;
    }
  },

  fetchPlatformStats: async () => {
    set({ isLoadingStats: true });
    try {
      const stats = await api.getPlatformStats();
      set({ platformStats: stats, isLoadingStats: false });
    } catch (error) {
      set({ isLoadingStats: false });
      throw error;
    }
  },

  fetchBookmarkedClaims: async (limit = 20, offset = 0) => {
    set({ isLoadingBookmarks: true });
    try {
      const response = await api.getBookmarkedClaims(limit, offset);
      const newBookmarkedIds = new Set(response.claims.map(c => c.id));
      set({
        bookmarkedClaims: response.claims,
        bookmarkedTotal: response.total,
        bookmarkedClaimIds: newBookmarkedIds,
        isLoadingBookmarks: false,
      });
    } catch (error) {
      set({ isLoadingBookmarks: false });
      throw error;
    }
  },

  fetchFollowedClaims: async (limit = 20, offset = 0) => {
    set({ isLoadingFollowed: true });
    try {
      const response = await api.getFollowedClaims(limit, offset);
      const newFollowedIds = new Set(response.claims.map(c => c.id));
      set({
        followedClaims: response.claims,
        followedTotal: response.total,
        followedClaimIds: newFollowedIds,
        isLoadingFollowed: false,
      });
    } catch (error) {
      set({ isLoadingFollowed: false });
      throw error;
    }
  },

  toggleBookmark: async (claimId: string) => {
    const isCurrentlyBookmarked = get().bookmarkedClaimIds.has(claimId);
    try {
      if (isCurrentlyBookmarked) {
        await api.removeBookmark(claimId);
        const newIds = new Set(get().bookmarkedClaimIds);
        newIds.delete(claimId);
        set({
          bookmarkedClaimIds: newIds,
          bookmarkedClaims: get().bookmarkedClaims.filter(c => c.id !== claimId),
          bookmarkedTotal: get().bookmarkedTotal - 1,
        });
        return false;
      } else {
        await api.bookmarkClaim(claimId);
        const newIds = new Set(get().bookmarkedClaimIds);
        newIds.add(claimId);
        set({
          bookmarkedClaimIds: newIds,
          bookmarkedTotal: get().bookmarkedTotal + 1,
        });
        return true;
      }
    } catch (error) {
      throw error;
    }
  },

  toggleFollow: async (claimId: string) => {
    const isCurrentlyFollowing = get().followedClaimIds.has(claimId);
    try {
      if (isCurrentlyFollowing) {
        await api.unfollowClaim(claimId);
        const newIds = new Set(get().followedClaimIds);
        newIds.delete(claimId);
        set({
          followedClaimIds: newIds,
          followedClaims: get().followedClaims.filter(c => c.id !== claimId),
          followedTotal: get().followedTotal - 1,
        });
        return false;
      } else {
        await api.followClaim(claimId);
        const newIds = new Set(get().followedClaimIds);
        newIds.add(claimId);
        set({
          followedClaimIds: newIds,
          followedTotal: get().followedTotal + 1,
        });
        return true;
      }
    } catch (error) {
      throw error;
    }
  },

  isBookmarked: (claimId: string) => {
    return get().bookmarkedClaimIds.has(claimId);
  },

  isFollowing: (claimId: string) => {
    return get().followedClaimIds.has(claimId);
  },

  reset: () => {
    set({
      trendingClaims: [],
      trendingUpdatedAt: null,
      topics: [],
      recommendedClaims: [],
      recommendedBasedOn: [],
      relatedClaims: [],
      relatedSourceClaimId: null,
      activityItems: [],
      activityHasMore: false,
      platformStats: null,
      bookmarkedClaims: [],
      bookmarkedTotal: 0,
      followedClaims: [],
      followedTotal: 0,
      bookmarkedClaimIds: new Set(),
      followedClaimIds: new Set(),
    });
  },
}));
