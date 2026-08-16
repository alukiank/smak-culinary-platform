export interface UserPrivateDto {
  id: string;
  username: string;
  displayname: string;
  email: string;
  role: 'user' | 'admin';
  isBanned: boolean;
  isVerified: boolean;
  dietary?: string[];
  allergies?: string[];
}

export interface UserPublicDto {
  id: string;
  username: string;
  displayname: string;
  averageRating?: number;
  totalReviews?: number;
}

export interface UserRestrictionsDto {
  allergies: string[];
  dietary: string[];
}

export interface UpdateUserDto {
  username?: string;
  displayname?: string;
  email?: string;
  dietary?: string[];
  allergies?: string[];
}

export interface UpdatePasswordDto {
  oldPassword?: string;
  newPassword?: string;
}

export interface UpdateUserAdminDto {
  displayname?: string;
  role?: 'user' | 'admin';
  isBanned?: boolean;
}

export interface UserAdminSearchResponse {
  data: UserPrivateDto[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}


