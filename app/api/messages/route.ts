import getCurrentUser from "@/app/actions/getCurrentUser";
import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import { pusherServer } from "@/app/libs/pusher";


export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser();
        const body = await request.json();
        const {
            message,
            image,
            conversationId,
            quotedMessageId
        } = body;

        let messageRelation: any = {};

        if (!currentUser?.id || !currentUser?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const newMessage = await prisma.message.create({
            data : {
                body: message,
                image: image,
                conversation: {
                    connect: {
                        id: conversationId
                    },
                },
                sender: {
                    connect: {
                        id: currentUser.id
                    }
                },
                seen: {
                    connect: {
                        id: currentUser.id
                    }
                }
            },
            include : {
                seen: true,
                sender: true
            }
        });

        if(quotedMessageId && quotedMessageId !== null) {
            const quotedMessage = await prisma.messageRelation.create({
                data: {
                    parentMessage: {
                        connect: {
                            id: quotedMessageId
                        }
                    },
                    messages: {
                        connect: {
                            id: newMessage.id
                        }
                    }
                },
                include: {
                    parentMessage: true,
                    messages: true
                }
            });

            messageRelation = await prisma.messageRelation.findFirst({
                where: {
                    messageId: newMessage.id
                },
                include: {
                    parentMessage: {
                        include: {
                            sender: true
                        }
                    },
                    messages: {
                        include: {
                            seen: true,
                            sender: true
                        }
                    }
                }
            })
        }

        

        const updatedConversation = await prisma.conversation.update({
            where: {
                id: conversationId
            },
            data: {
                lastMessageAt: new Date(),
                messages: {
                    connect: {
                        id: newMessage.id
                    }
                }
            },
            include: {
                users: true,
                messages: {
                    include: {
                        seen: true
                    }
                }
            }
        });

        console.log("MESSAGE_RELATION >>", messageRelation);

        // console.log("NEW_MESSAGE :", newMessage);
        // console.log("UPDATED_CONVERSATION :", updatedConversation);

        const newMessageReformated = {
            body: newMessage.body,
            conversationId: newMessage.conversationId,
            createdAt: newMessage.createdAt,
            id: newMessage.id,
            image: newMessage.image,
            seen: newMessage.seen,
            seenIds: newMessage.seenIds,
            sender: newMessage.sender,
            senderId: newMessage.senderId,
            quotedMessageId: messageRelation?.parentMessage?.id ?? null,
            quotedMessage: messageRelation?.parentMessage ?? null
        }

        await pusherServer.trigger(conversationId, 'messages:new', newMessageReformated);

        const lastMessage = updatedConversation.messages[updatedConversation.messages.length -1];

        // console.log("UPDATED_CONVERSATION :", updatedConversation);

        updatedConversation.users.map((user) => {
            pusherServer.trigger(user.email!, 'conversation:update', {
                id: conversationId,
                messages: [lastMessage]
            })
        });

        return NextResponse.json(newMessageReformated);

    } catch (error: any) {
        console.log(error, "ERROR_MESSAGES");
        return new NextResponse('InternalError', { status: 500 });
    }

}