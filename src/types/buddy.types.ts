export const BuddyStatus = {
  Active: 0,
  Completed: 1,
} as const;

export type BuddyStatus = typeof BuddyStatus[keyof typeof BuddyStatus];

export interface BuddyAssignmentDto {
  id: number;
  newEmployeeId: number;
  newEmployeeFullName: string;
  buddyId: number;
  buddyFullName: string;
  assignedAt: string;
  notes?: string;
  status: BuddyStatus;
}

export interface AssignBuddyRequest {
  newEmployeeId: number;
  buddyId: number;
  notes?: string;
}

export interface UpdateBuddyAssignmentRequest {
  buddyId?: number;
  notes?: string;
}
