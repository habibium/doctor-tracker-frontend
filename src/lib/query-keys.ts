/** Root keys per resource. A mutation invalidates a root to refresh everything under it. */
export const queryKeys = {
  doctors: ["doctors"],
  patients: ["patients"],
  analytics: ["analytics"],
  users: ["users"],
} as const;
