import { Conversation, Message, User } from "@prisma/client";

export type FullMessageType = Message & {
    sender: User,
    seen: User[],
    quotedMessageId: string | null
    quotedMessage: Message & {
        sender: User,
    } | null
};

export type FullConversationType = Conversation & {
    users: User[],
    messages: FullMessageType[],
};

export type UserTypingType = {
    name: string,
    email: string,
    conversationId: string,
}

