import { create } from 'zustand';
import { api, Comment, CommentCreate } from '@/lib/api';

interface CommentsState {
  comments: Comment[];
  total: number;
  isLoading: boolean;

  // Actions
  fetchComments: (claimId: string, evidenceId?: string) => Promise<void>;
  addComment: (claimId: string, data: CommentCreate) => Promise<Comment>;
  updateComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  voteOnComment: (commentId: string, direction: 'up' | 'down') => Promise<void>;
  removeVote: (commentId: string) => Promise<void>;
  clearComments: () => void;
}

// Helper to update a comment in a nested tree
function updateCommentInTree(
  comments: Comment[],
  commentId: string,
  updater: (comment: Comment) => Comment
): Comment[] {
  return comments.map((comment) => {
    if (comment.id === commentId) {
      return updater(comment);
    }
    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: updateCommentInTree(comment.replies, commentId, updater),
      };
    }
    return comment;
  });
}

// Helper to add a reply to the correct parent
function addReplyToTree(
  comments: Comment[],
  parentId: string,
  newComment: Comment
): Comment[] {
  return comments.map((comment) => {
    if (comment.id === parentId) {
      return {
        ...comment,
        replies: [...(comment.replies || []), newComment],
      };
    }
    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: addReplyToTree(comment.replies, parentId, newComment),
      };
    }
    return comment;
  });
}

export const useCommentsStore = create<CommentsState>((set, get) => ({
  comments: [],
  total: 0,
  isLoading: false,

  fetchComments: async (claimId: string, evidenceId?: string) => {
    set({ isLoading: true });
    try {
      const response = await api.getComments(claimId, evidenceId);
      set({
        comments: response.comments,
        total: response.total,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  addComment: async (claimId: string, data: CommentCreate) => {
    const comment = await api.createComment(claimId, data);

    set((state) => {
      if (data.parent_id) {
        // Add as a reply to the parent comment
        return {
          comments: addReplyToTree(state.comments, data.parent_id, comment),
        };
      } else {
        // Add as a root-level comment
        return {
          comments: [...state.comments, comment],
          total: state.total + 1,
        };
      }
    });

    return comment;
  },

  updateComment: async (commentId: string, content: string) => {
    const updated = await api.updateComment(commentId, content);

    set((state) => ({
      comments: updateCommentInTree(state.comments, commentId, (c) => ({
        ...c,
        content: updated.content,
        is_edited: true,
        updated_at: updated.updated_at,
      })),
    }));
  },

  deleteComment: async (commentId: string) => {
    await api.deleteComment(commentId);

    set((state) => ({
      comments: updateCommentInTree(state.comments, commentId, (c) => ({
        ...c,
        content: '[deleted]',
        is_deleted: true,
      })),
    }));
  },

  voteOnComment: async (commentId: string, direction: 'up' | 'down') => {
    const updated = await api.voteOnComment(commentId, direction);

    set((state) => ({
      comments: updateCommentInTree(state.comments, commentId, (c) => ({
        ...c,
        upvotes: updated.upvotes,
        downvotes: updated.downvotes,
        vote_score: updated.vote_score,
        user_vote: direction,
      })),
    }));
  },

  removeVote: async (commentId: string) => {
    await api.removeCommentVote(commentId);

    set((state) => ({
      comments: updateCommentInTree(state.comments, commentId, (c) => {
        // Calculate new scores based on what the vote was
        let upvotes = c.upvotes;
        let downvotes = c.downvotes;
        if (c.user_vote === 'up') upvotes -= 1;
        if (c.user_vote === 'down') downvotes -= 1;

        return {
          ...c,
          upvotes,
          downvotes,
          vote_score: upvotes - downvotes,
          user_vote: null,
        };
      }),
    }));
  },

  clearComments: () => {
    set({ comments: [], total: 0 });
  },
}));
