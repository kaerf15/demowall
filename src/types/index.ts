export interface Category {
  id: string;
  name: string;
  slug: string;
  type?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  images?: string | null; // JSON string
  websiteUrl: string;
  githubUrl?: string | null;
  userId: string;
  categories: Category[];
  likes: number;
  favorites: number;
  createdAt: string;
  status: string;
  detail?: string | null;
  user?: {
    username: string;
    avatar: string | null;
    title?: string | null;
  };
  hasLiked?: boolean;
  hasFavorited?: boolean;
}
