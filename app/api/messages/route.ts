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

        if (!currentUser?.id || !currentUser?.email) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        let data: any = {}
        let include: any = {}

        if(quotedMessageId && quotedMessageId !== undefined && quotedMessageId !== "") {
            data = {
                body: message,
                image: image,
                quotedMessage: {
                    connect: {
                        id: quotedMessageId
                    }
                },
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
            }

            include = {
                seen: true,
                sender: true,
                quotedMessage: {
                    include: {
                        quotedMessage: true,
                        sender: true,
                    }
                }
            }

        }else {

            data = {
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
            }

            include = {
                seen: true,
                sender: true, 
            }
        }

        const newMessage = await prisma.message.create({
            data: {
                ...data
            },
            include: {
                ...include
            }
        });

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

        console.log("NEW_MESSAGE :", newMessage);
        console.log("UPDATED_CONVERSATION :", updatedConversation);

        await pusherServer.trigger(conversationId, 'messages:new', newMessage);

        const lastMessage = updatedConversation.messages[updatedConversation.messages.length -1];

        console.log("UPDATED_CONVERSATION :", updatedConversation);

        updatedConversation.users.map((user) => {
            pusherServer.trigger(user.email!, 'conversation:update', {
                id: conversationId,
                messages: [lastMessage]
            })
        });

        return NextResponse.json(newMessage);

    } catch (error: any) {
        console.log(error, "ERROR_MESSAGES");
        return new NextResponse('InternalError', { status: 500 });
    }

}