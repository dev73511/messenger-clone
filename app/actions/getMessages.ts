import prisma from "@/app/libs/prismadb";

const getMessages = async (conversationId: string) => {
    try {
        const messages = await prisma.message.findMany({
            where: {
                conversationId: conversationId
            },
            include: {
                sender: true,
                seen: true,
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
            },
            orderBy: {
                createdAt: "asc"
            }
        });

        return messages.map((data, index) => ({
            body: data.body,
            conversationId: data.conversationId,
            createdAt: data.createdAt,
            id: data.id,
            image: data.image,
            sender: data.sender,
            senderId: data.senderId,
            seenIds: data.seenIds,
            seen: data.seen,
            quotedMessageId: data?.messages[0]?.id ?? null,
            quotedMessage: data?.messages[0]?.parentMessage ?? null
        }));

    } catch (error: any) {
        return [];
    }
}

export default getMessages;