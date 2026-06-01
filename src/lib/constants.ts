/**
 * Application-wide constants for CampuSync.
 *
 * All threshold values, limits, and configurable defaults must be sourced
 * from this file. Never hardcode these values in components.
 *
 * The ATTENDANCE_THRESHOLD_DEFAULT reflects CUZ institutional policy (80%).
 * Per-module thresholds are stored in the modules.attendance_threshold column
 * and take precedence over this default at the component level.
 */

/** Default attendance threshold percentage. Aligns with CUZ institutional policy. */
export const ATTENDANCE_THRESHOLD_DEFAULT = 80;

/** Minimum password length enforced at registration. */
export const MIN_PASSWORD_LENGTH = 6;

/** Maximum number of attendance records fetched per query. */
export const ATTENDANCE_QUERY_LIMIT = 100;

/** Application name — used in page titles and headers. */
export const APP_NAME = 'CampuSync';

/** Institution name. */
export const INSTITUTION_NAME = 'Cavendish University Zambia';

/** Attendance status values — must match the database ENUM. */
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  LATE: 'late',
  ABSENT: 'absent',
} as const;

export type AttendanceStatus = typeof ATTENDANCE_STATUS[keyof typeof ATTENDANCE_STATUS];

/** User role values — must match the database app_role ENUM. */
export const USER_ROLES = {
  ADMIN: 'admin',
  LECTURER: 'lecturer',
  STUDENT: 'student',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
