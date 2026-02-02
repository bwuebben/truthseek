'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import { Comment } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useCommentsStore } from '@/stores/commentsStore';
import { CommentForm } from './CommentForm';

interface CommentCardProps {
  comment: Comment;
  claimId: string;
  maxDepth?: number;
}

const MAX_VISIBLE_DEPTH = 3;

export function CommentCard({
  comment,
  claimId,
  maxDepth = MAX_VISIBLE_DEPTH,
}: CommentCardProps) {
  const { agent, isAuthenticated } = useAuthStore();
  const { addComment, updateComment, deleteComment, voteOnComment, removeVote } =
    useCommentsStore();

  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(true);

  const isOwner = agent?.id === comment.author.id;
  const canReply = isAuthenticated && comment.depth < maxDepth && !comment.is_deleted;

  const handleReply = async (content: string) => {
    await addComment(claimId, {
      content,
      parent_id: comment.id,
    });
    setIsReplying(false);
  };

  const handleEdit = async () => {
    if (editContent.trim() && editContent !== comment.content) {
      await updateComment(comment.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await deleteComment(comment.id);
    }
  };

  const handleVote = async (direction: 'up' | 'down') => {
    if (comment.user_vote === direction) {
      await removeVote(comment.id);
    } else {
      await voteOnComment(comment.id, direction);
    }
  };

  return (
    <div className={clsx('flex gap-3', comment.depth > 0 && 'ml-8 mt-3')}>
      {/* Avatar */}
      <div className="flex-shrink-0">
        {comment.author.avatar_url ? (
          <img
            src={comment.author.avatar_url}
            alt={comment.author.username}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium">
            {comment.author.username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-grow min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/agents/${comment.author.id}`}
            className="font-medium text-gray-900 hover:text-blue-600"
          >
            {comment.author.display_name || comment.author.username}
          </Link>
          <span className="text-gray-400">·</span>
          <span className="text-gray-500">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
          {comment.is_edited && (
            <>
              <span className="text-gray-400">·</span>
              <span className="text-gray-400 italic">edited</span>
            </>
          )}
        </div>

        {/* Body */}
        {isEditing ? (
          <div className="mt-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
              <button onClick={handleEdit} className="btn-primary text-sm">
                Save
              </button>
            </div>
          </div>
        ) : (
          <p
            className={clsx(
              'mt-1 text-gray-700 whitespace-pre-wrap',
              comment.is_deleted && 'italic text-gray-400'
            )}
          >
            {comment.content}
          </p>
        )}

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-4 mt-2 text-sm">
            {/* Vote buttons */}
            {isAuthenticated && !isOwner && !comment.is_deleted && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleVote('up')}
                  className={clsx(
                    'p-1 rounded hover:bg-gray-100 transition-colors',
                    comment.user_vote === 'up' && 'text-green-600'
                  )}
                  title="Upvote"
                >
                  <svg
                    className="w-4 h-4"
                    fill={comment.user_vote === 'up' ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </button>
                <span
                  className={clsx(
                    'min-w-[1.5rem] text-center',
                    comment.vote_score > 0 && 'text-green-600',
                    comment.vote_score < 0 && 'text-red-600'
                  )}
                >
                  {comment.vote_score}
                </span>
                <button
                  onClick={() => handleVote('down')}
                  className={clsx(
                    'p-1 rounded hover:bg-gray-100 transition-colors',
                    comment.user_vote === 'down' && 'text-red-600'
                  )}
                  title="Downvote"
                >
                  <svg
                    className="w-4 h-4"
                    fill={comment.user_vote === 'down' ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
            )}

            {/* Reply button */}
            {canReply && (
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="text-gray-500 hover:text-gray-700"
              >
                Reply
              </button>
            )}

            {/* Owner actions */}
            {isOwner && !comment.is_deleted && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="text-gray-500 hover:text-red-600"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}

        {/* Reply form */}
        {isReplying && (
          <div className="mt-3">
            <CommentForm
              onSubmit={handleReply}
              onCancel={() => setIsReplying(false)}
              placeholder="Write a reply..."
              submitLabel="Reply"
              isReply
              autoFocus
            />
          </div>
        )}

        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.length > 3 && !showReplies ? (
              <button
                onClick={() => setShowReplies(true)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Show {comment.replies.length} replies
              </button>
            ) : (
              comment.replies.map((reply) => (
                <CommentCard
                  key={reply.id}
                  comment={reply}
                  claimId={claimId}
                  maxDepth={maxDepth}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
