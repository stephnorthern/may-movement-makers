import { Participant } from "@/types";

export const getParticipantNameFromAuthId = (authId: string, participants: Participant[]) => {
    const participant = participants.find(p => p.id === authId);
    return participant ? participant.name : "Unknown";
};
export const getParticipantFromAuthId = (authId: string, participants: Participant[]): Participant | undefined => {
    return participants.find(p => p.id === authId);
};