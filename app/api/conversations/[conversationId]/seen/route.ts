import getCurrentUser from "@/app/actions/getCurrentUser";
import { NextResponse } from "next/server";
import prisma from "../../../../libs/prismadb";
import { pusherServer } from "@/app/libs/pusher";

interface IParams {
    conversationId?: string;
}

export async function POST(request: Request, {params}: {params: IParams}){
    try {
        const currentUser = await getCurrentUser();
        const { conversationId } = params;

        if(!currentUser?.id || !currentUser?.email) {
            return new NextResponse('Unauthorized', {status: 401});
        }

        //Find the existing conversation
        const conversation = await prisma.conversation.findUnique({
            where: {
                id: conversationId
            },
            include: {
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
                users: true
            }
        });

        // console.log("CONVERSATIONS>>", conversation);

        if(!conversation) {
            return new NextResponse('Invalid ID', {status: 400});
        }

        // Find the last message
        const lastMessage = conversation.messages[conversation.messages.length -1];

        if(!lastMessage) {
            return NextResponse.json(conversation);
        }

        // update seen of last message
        const updatedMessages = await prisma.message.update({
            where: {
                id: lastMessage.id,
            },
            include: {
                sender: true,
                seen: true,
            },
            data: {
                seen: {
                    connect: {
                        id: currentUser.id
                    }
                }
            }
        })

        // * lets find updatedMessages Relation
        const updatedMessagesRelation = await prisma.messageRelation.findFirst({
            where: {
                messageId: lastMessage.id
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


        // console.log("UPDATED_MESSAGE >>", updatedMessages);

        const updatedMessagesFormated = {
            ...updatedMessages,
            id: updatedMessages.id,
            body: updatedMessages.body,
            image: updatedMessages.image,
            conversationId: updatedMessages.conversationId,
            seen: updatedMessages.seen,
            seenIds: updatedMessages.seenIds,
            sender: updatedMessages.sender,
            senderId: updatedMessages.senderId,
            createdAt: updatedMessages.createdAt,
            quotedMessageId: updatedMessagesRelation?.parentMessageId ?? null,
            quotedMessage: updatedMessagesRelation?.parentMessage ?? null
        }

        await pusherServer.trigger(currentUser.email, 'conversation:update', {
            id: conversationId,
            messages: [updatedMessagesFormated]
        });

        if(lastMessage.seenIds.indexOf(currentUser.id) !== -1){
            const conversationFormated: any = {
                ...conversation,
                id: conversation.id,
                isGroup: conversation.isGroup,
                lastMessageAt: conversation.lastMessageAt,
                createdAt: conversation.createdAt,
                messageIds: conversation.messageIds,
                messages: conversation.messages.map((data, index) => ({
                    id: data.id,
                    body: data.body,
                    createdAt: data.createdAt,
                    conversationId: data.conversationId,
                    image: data.image,
                    seen: data.seen,
                    seenIds: data.seenIds,
                    senderId: data.senderId,
                    sender: data.sender,
                    quotedMessageId: data.messages[0]?.parentMessageId ?? null,
                    quotedMessage: data.messages[0]?.parentMessage ?? null,
                }))
            }
            return NextResponse.json(conversationFormated);
        }

        await pusherServer.trigger(conversationId!, 'message:update', updatedMessagesFormated);

        return NextResponse.json(updatedMessagesFormated);

    } catch (error: any) {
        console.log(error, "ERROR_MESSAGES_SEEN");
        return new NextResponse('Internal Error', { status: 500 });
    }
}

