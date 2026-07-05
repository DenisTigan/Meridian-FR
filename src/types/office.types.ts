export interface OfficeDto {
  id: number;
  name: string;
  address: string;
  floorCount: number;
  totalDesks: number;
  createdAt: string;
}

export interface DeskDto {
  id: number;
  officeId: number;
  deskCode: string;
  floor: number;
  zone: string;
  positionX: number;
  positionY: number;
  isActive: boolean;
  isAvailable?: boolean;
}

export interface PresenceDto {
  employeeId: number;
  fullName: string;
  departmentName: string;
  deskId: number;
  deskCode: string;
  officeName: string;
}
