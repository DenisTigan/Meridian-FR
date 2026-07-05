export const TrainingCategory = {
  Mandatory: 0,
  Technical: 1,
  Optional: 2
} as const;
export type TrainingCategory = typeof TrainingCategory[keyof typeof TrainingCategory];

export const TrainingModuleType = {
  Article: 0,
  Video: 1,
  Quiz: 2
} as const;
export type TrainingModuleType = typeof TrainingModuleType[keyof typeof TrainingModuleType];

export interface TrainingModuleDto {
  id: number;
  courseId: number;
  title: string;
  content: string;
  moduleType: TrainingModuleType;
  orderIndex: number;
  durationMinutes: number;
}

export interface TrainingCourseDto {
  id: number;
  title: string;
  description: string;
  category: TrainingCategory;
  estimatedMinutes: number;
  thumbnailUrl: string | null;
  isMandatoryForNewHires: boolean;
  createdById: number;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  modules: TrainingModuleDto[];
}

export interface CourseEnrollmentDto {
  id: number;
  courseId: number;
  courseTitle: string;
  employeeId: number;
  employeeName: string;
  enrolledAt: string;
  lastAccessedAt: string | null;
  completedAt: string | null;
  progressPercent: number;
  isCompleted: boolean;
  certificateUrl: string | null;
}

export interface CreateCourseRequest {
  title: string;
  description: string;
  category: TrainingCategory;
  estimatedMinutes: number;
  thumbnailUrl?: string;
  isMandatoryForNewHires: boolean;
}

export interface UpdateCourseRequest extends CreateCourseRequest {
  isActive: boolean;
}

export interface CreateModuleRequest {
  title: string;
  content: string;
  moduleType: TrainingModuleType;
  orderIndex: number;
  durationMinutes: number;
}

export interface CreateEnrollmentRequest {
  courseId: number;
}

export interface UpdateProgressRequest {
  progressPercent: number;
}
