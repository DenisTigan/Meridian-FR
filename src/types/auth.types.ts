export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  requiresPasswordChange: boolean;
  refreshToken: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface EmployeeDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  departmentId?: string;
  jobTitle?: string;
  // Alte campuri vor fi adaugate ulterior conform spec
}
