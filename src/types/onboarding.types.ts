export const OnboardingPhase = {
  DayOne: 0,
  WeekOne: 1,
  FirstMonth: 2,
} as const;

export type OnboardingPhase = typeof OnboardingPhase[keyof typeof OnboardingPhase];

export interface OnboardingTaskDto {
  id: number;
  checklistId: number;
  phase: OnboardingPhase;
  title: string;
  description: string;
  isCompleted: boolean;
  completedAt?: string;
  autoTriggerType: string | null;
  orderIndex: number;
}

export interface OnboardingChecklistDto {
  id: number;
  employeeId: number;
  overallProgress: number; // 0-100
  createdAt: string;
  tasks: OnboardingTaskDto[];
}
