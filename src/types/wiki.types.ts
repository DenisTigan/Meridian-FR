export interface WikiCategoryDto {
  id: number;
  name: string;
  slug: string;
  parentCategoryId: number | null;
  orderIndex: number;
}

export interface WikiCategoryTreeDto {
  id: number;
  name: string;
  slug: string;
  children: WikiCategoryTreeDto[];
}

export interface WikiArticleDto {
  id: number;
  title: string;
  slug: string;
  content: string;
  categoryId: number;
  categoryName: string;
  authorId: number;
  authorName: string;
  isPublished: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArticleRequest {
  title: string;
  content: string;
  categoryId: number;
  isPublished: boolean;
}

export interface UpdateArticleRequest extends CreateArticleRequest {
}

export interface CreateCategoryRequest {
  name: string;
  parentCategoryId?: number;
  orderIndex: number;
}
