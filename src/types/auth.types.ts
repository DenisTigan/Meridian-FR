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
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  employeeCode?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  hireDate?: string;
  jobTitle?: string;
  departmentId?: string;
  teamId?: string;
  managerId?: string;
  roleId?: string;
  isFirstLogin?: boolean;
  workStatus?: number; // 0=InOffice, 1=Remote, 2=OnLeave
}
