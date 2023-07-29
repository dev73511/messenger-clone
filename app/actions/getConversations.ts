import prisma from "@/app/libs/prismadb";
import getCurrentUser from "./getCurrentUser";

const getConversations = async () => {

    const currentUser = await getCurrentUser();

    if (!currentUser?.id) {
        return [];
    }

    try {

        const conversations = await prisma.conversation.findMany({
            orderBy: {
                lastMessageAt: 'desc'
            },

            where: {
                userIds: {
                    has: currentUser.id
                }
            },
            include: {
                users: true,
                messages: {
                    include: {
                        seen: true,
                        sender: true,
                        messages: {
                            include: {
                                parentMessage: {
                                    include: {
                                        seen: true,
                                        sender: true
                                    }
                                }
                            }
                        }
                    }
                },
            }
        });

        console.log("getConversations.CONVERSATIONS >>", conversations)

        const conversationFormated: any[] = conversations.map((item) => ({
            id: item.id,
            createdAt: item.createdAt,
            lastMessageAt: item.lastMessageAt,
            name: item.name,
            isGroup: item.isGroup,
            messageIds: item.messageIds,
            userIds: item.userIds,
            users: item.users,
            messages: item.messages.map((messageItem) => ({
                id: messageItem.id,
                body: messageItem.body,
                conversationId: messageItem.conversationId,
                image: messageItem.image,
                seen: messageItem.seen,
                seenIds: messageItem.seenIds,
                senderId: messageItem.senderId,
                sender: messageItem.sender,
                quotedMessageId: messageItem.messages[0]?.parentMessageId ?? null,
                quotedMessage: messageItem.messages[0]?.parentMessage ?? null
            }))
        }))

        return conversationFormated

    } catch (error: any) {
        return [];
    }

}

export default getConversations;