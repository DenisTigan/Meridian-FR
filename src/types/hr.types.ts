export const TicketCategory = {
  Certificate: 0,
  PayrollQuery: 1,
  InfoUpdate: 2,
  General: 3
} as const;
export type TicketCategory = typeof TicketCategory[keyof typeof TicketCategory];

export const TicketStatus = {
  Open: 0,
  InProgress: 1,
  Resolved: 2
} as const;
export type TicketStatus = typeof TicketStatus[keyof typeof TicketStatus];

export interface HRTicketDto {
  id: number;
  ticketNumber: string;
  employeeId: number;
  employeeName: string;
  category: TicketCategory;
  subject: string;
  description: string;
  status: TicketStatus;
  assignedToId: number | null;
  assignedToName: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketRequest {
  category: TicketCategory;
  subject: string;
  description: string;
}

export interface UpdateTicketStatusRequest {
  status: TicketStatus;
}

export interface AssignTicketRequest {
  assignedToId: number;
}

export const LeaveType = {
  Annual: 0,
  Sick: 1,
  Personal: 2,
  Maternity: 3,
  Paternity: 4
} as const;
export type LeaveType = typeof LeaveType[keyof typeof LeaveType];

export const LeaveRequestStatus = {
  Pending: 0,
  Approved: 1,
  Rejected: 2
} as const;
export type LeaveRequestStatus = typeof LeaveRequestStatus[keyof typeof LeaveRequestStatus];

export interface LeaveRequestDto {
  id: number;
  employeeId: number;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  status: LeaveRequestStatus;
  reviewedById: number | null;
  reviewedByName: string | null;
  managerComment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveRequest {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface ReviewLeaveRequest {
  status: LeaveRequestStatus;
  managerComment?: string;
}

export interface LeaveBalanceDto {
  id: number;
  employeeId: number;
  year: number;
  leaveType: LeaveType;
  allottedDays: number;
  usedDays: number;
  remainingDays: number;
}
