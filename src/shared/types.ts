export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface SimpleUser {
  id: number;
  first_name: string;
  last_name: string;
}

export interface Liker {
  id: number;
  first_name: string;
  last_name: string;
  reaction_type?: string;
}

export interface Reply {
  id: number;
  comment_id: number;
  user_id: number;
  content: string;
  created_at: string;
  likesCount: number;
  isLiked: boolean;
  likers: Liker[];
  user: SimpleUser;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: string;
  likesCount: number;
  isLiked: boolean;
  likers: Liker[];
  replies: Reply[];
  user: SimpleUser;
}

export interface Post {
  id: number;
  user_id: number;
  content: string;
  image_url: string | null;
  visibility: string;
  created_at: string;
  likesCount: number;
  isLiked: boolean;
  userReactionType?: string | null;
  likers: Liker[];
  comments: Comment[];
  user: SimpleUser;
}

// Request/Service payload inputs
export interface RegisterInput {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreatePostInput {
  userId: number;
  content: string;
  imageUrl: string | null;
  visibility?: string;
}

export interface CommentInput {
  postId: number;
  userId: number;
  content: string;
}

export interface ReplyInput {
  commentId: number;
  userId: number;
  content: string;
}

export interface PostLikeInput {
  postId: number;
  userId: number;
  type?: string;
}

export interface CommentLikeInput {
  commentId: number;
  userId: number;
}

export interface ReplyLikeInput {
  replyId: number;
  userId: number;
}
