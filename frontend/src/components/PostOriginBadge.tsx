import React from 'react';
import { getPostOrigin, isLocalPost } from '../utils/postUtils';
import './PostOriginBadge.css';

interface PostOriginBadgeProps {
  postUrl: string;
  className?: string;
}

export const PostOriginBadge: React.FC<PostOriginBadgeProps> = ({ 
  postUrl, 
  className = '' 
}) => {
  const origin = getPostOrigin(postUrl);
  const isLocal = isLocalPost(postUrl);
  
  return (
    <span 
      className={`post-origin-badge ${isLocal ? 'local' : 'external'} ${className}`}
      title={isLocal ? 'This is a local post' : `This post is from ${origin}`}
    >
      {isLocal ? '🏠' : '🌐'} {origin}
    </span>
  );
};
