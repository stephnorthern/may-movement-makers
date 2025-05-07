
/**
 * Activities API - Main entry point
 * Re-exports all activity-related API functions for easier imports
 */

export { getActivities, getParticipantActivities } from './queries';
export { addActivity, deleteActivity } from './mutations';

