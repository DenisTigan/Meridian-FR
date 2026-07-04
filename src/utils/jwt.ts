import { jwtDecode } from 'jwt-decode';

export interface CustomJwtPayload {
  sub?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'?: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string | string[];
}

export function getCurrentUserId(token: string | null): number | null {
  if (!token) return null;
  try {
    const decoded = jwtDecode<CustomJwtPayload>(token);
    // Typical claims for user ID
    const userIdString = decoded.sub || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    if (userIdString) {
      const parsed = parseInt(userIdString, 10);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function getCurrentUserRoles(token: string | null): string[] {
  if (!token) return [];
  try {
    const decoded = jwtDecode<CustomJwtPayload>(token);
    const roleClaim = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']; if (!roleClaim) return [];
    return Array.isArray(roleClaim) ? roleClaim : [roleClaim];
  } catch {
    return [];
  }
}

export function hasRole(token: string | null, rolesToCheck: string[]): boolean {
  const roles = getCurrentUserRoles(token);
  return rolesToCheck.some(role => roles.includes(role));
}
