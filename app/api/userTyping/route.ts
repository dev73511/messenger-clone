import getCurrentUser from "@/app/actions/getCurrentUser";
import { NextResponse } from "next/server";
import prisma from "@/app/libs/prismadb";
import { pusherServer } from "@/app/libs/pusher";

export async function POST(request: Request){
    try {
        
        const currentUser = await getCurrentUser();
        const body = await request.json();
        const {name, email, conversationId} = body;

        if(!currentUser?.id || !currentUser?.email) {
            return new NextResponse('Unauthorized', {status: 401});
        }

        const data = {
            name,
            email,
            conversationId
        }

        await pusherServer.trigger(conversationId, 'user:typing', data);

        return NextResponse.json({success: "true", message: "event trigger successfully"});

    } catch (error: any) {
        console.log("USER.TYPING ERROR_MESSAGE: ", error);
        return new NextResponse('Internal Error', {status: 500});
    }
}