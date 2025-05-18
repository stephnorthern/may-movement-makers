export const isOwningUser = (participantId: string, userId: string) => {
  return participantId === userId;
};