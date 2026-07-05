export const EventCategory = {
  General: 0,
  Meeting: 1,
  Holiday: 2,
  Training: 3,
  SocialEvent: 4,
  Deadline: 5,
  Other: 6
} as const;

export type EventCategory = typeof EventCategory[keyof typeof EventCategory];

export interface CalendarEventDto {
  id: number;
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  isAllDay: boolean;
  category: EventCategory;
  location: string;
  meetingUrl: string | null;
  createdBy: number;
  createdByName: string;
  createdAt: string;
}

export interface CreateCalendarEventRequest {
  title: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  isAllDay: boolean;
  category: EventCategory;
  location: string;
  meetingUrl: string | null;
}
