export const BookingStatus = {
  Confirmed: 0,
  Cancelled: 1
} as const;

export type BookingStatus = typeof BookingStatus[keyof typeof BookingStatus];

export interface DeskBookingDto {
  id: number;
  deskId: number;
  deskCode: string;
  officeName: string;
  employeeId: number;
  employeeFullName: string;
  bookingDate: string;
  status: BookingStatus;
  createdAt: string;
  cancelledAt: string | null;
}

export interface PagedBookingResponse {
  items: DeskBookingDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface CreateBookingRequest {
  deskId: number;
  date: string;
}
