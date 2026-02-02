'use client';

import { useEffect } from 'react';
import { useCommentsStore } from '@/stores/commentsStore';
import { useAuthStore } from '@/stores/authStore';
import { CommentCard } from './CommentCard';
import { CommentForm } from './CommentForm';

interface CommentSectionProps {
  claimId: string;
  evidenceId?: string;
}

export function CommentSection({ claimId, evidenceId }: CommentSectionProps) {
  const { comments, total, isLoading, fetchComments, addComment, clearComments } =
    useCommentsStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    fetchComments(claimId, evidenceId);
    return () => clearComments();
  }, [claimId, evidenceId, fetchComments, clearComments]);

  const handleSubmit = async (content: string) => {
    await addComment(claimId, {
      content,
      evidence_id: evidenceId,
    });
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-text-primary mb-4">
        Comments {total > 0 && `(${total})`}
      </h3>

      {/* Comment form */}
      {isAuthenticated ? (
        <div className="mb-6">
          <CommentForm
            onSubmit={handleSubmit}
            placeholder="Add a comment..."
          />
        </div>
      ) : (
        <p className="text-text-muted mb-6">
          Sign in to join the discussion.
        </p>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-coral" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-text-muted">
          No comments yet. Be the first to share your thoughts!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              claimId={claimId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
