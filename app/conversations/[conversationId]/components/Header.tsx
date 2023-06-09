"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Conversation, User } from "@prisma/client";
import { HiChevronLeft, HiEllipsisHorizontal } from "react-icons/hi2";

import Link from "next/link";
import useOtherUser from "@/app/hooks/useOtherUser";

import Avatar from "@/app/components/Avatar";
import ProfileDrawer from "./ProfileDrawer";
import AvatarGroup from "@/app/components/AvatarGroup";
import useActiveList from "@/app/hooks/useActiveList";
import useConversation from "@/app/hooks/useConversation";
import { pusherClient } from "@/app/libs/pusher";
import { UserTypingType } from "@/app/types";
import { useSession } from "next-auth/react";
import { find } from "lodash";

interface HeaderProps {
    conversation: Conversation & {
        users: User[]
    }
}

const Header: React.FC<HeaderProps> = ({ conversation }) => {

    const otherUser = useOtherUser(conversation);
    const session = useSession();

    const { conversationId } = useConversation();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [userTypingStatus, setUserTypingStatus] = useState<UserTypingType[]>([]);

    const { members } = useActiveList();
    const isActive = members.indexOf(otherUser?.email!) !== -1;

    // console.log("drawerOpen >>", drawerOpen);

    const statusText = useMemo(() => {

        if (conversation.isGroup) {
            return `${conversation.users.length} members`;
        }

        return isActive ? 'Active' : 'Offline';

    }, [conversation, isActive])

    useEffect(() => {

        pusherClient.subscribe(conversationId);

        let clearTimerId: any;
        const userTypingHandler = (userTypingStatusData: UserTypingType) => {
            console.log("userTypingHandler: ", userTypingStatusData);

                if(userTypingStatusData.email !== session?.data?.user?.email) {
                    setUserTypingStatus((current) => {
                        if(find(current, {email: userTypingStatusData.email})){
                            
                            return current;
                        }
    
                        return[...current, userTypingStatusData];
                    })
                }
                

            //restart timeout timer
            clearTimeout(clearTimerId);
            clearTimerId = setTimeout(function () {
                //clear user is typing message
                setUserTypingStatus([]);
            }, 900);
        }

        pusherClient.bind('user:typing', userTypingHandler);

        return () => {
            pusherClient.unsubscribe(conversationId);
            pusherClient.unbind('user:typing', userTypingHandler);

        }

    }, [conversationId]);

    console.log("userTypingStatus: ", userTypingStatus);

    return (
        <>
            <ProfileDrawer
                data={conversation}
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
            />

            <div
                className="
                    bg-white
                    w-full
                    flex
                    border-b-[1px]
                    sm:px-4 
                    py-3
                    px-4
                    lg:px-6
                    justify-between
                    items-center
                    shadow-sm
                "
            >
                <div className="flex gap-3 items-center">
                    <Link
                        className="
                        lg:hidden
                        block
                        text-sky-500
                        hover:text-sky-600
                        transition
                        cursor-pointer
                    "
                        href={"/conversations"}
                    >
                        <HiChevronLeft size={32} />
                    </Link>
                    {
                        conversation?.isGroup ? (
                            <AvatarGroup users={conversation?.users} />
                        ) : (
                            <Avatar user={otherUser} />
                        )
                    }

                    <div className="flex flex-col">
                        <div>
                            {conversation.name || otherUser.name}
                        </div>
                            
                        

                        {
                            conversation?.isGroup && userTypingStatus.length > 0 ? (
                                <div className="
                                    text-sm
                                    font-light
                                    text-neutral-500
                                ">
                                    { userTypingStatus.map((item) => item.name).join(", ").concat("is typing") }
                                </div>
                            ) : !conversation?.isGroup && userTypingStatus.length > 0 ? (
                                <div
                                    className="
                                    text-sm
                                    font-light
                                    text-neutral-500
                                    "
                                >
                                    is typing
                                </div>
                            ) : (
                                <div className="
                                        text-sm
                                        font-light
                                        text-neutral-500
                                    ">
                                    {statusText}
                                </div>
                            )
                        }
                        


                    </div>



                </div>


                <HiEllipsisHorizontal
                    size={32}
                    onClick={() => setDrawerOpen(true)}
                    className="
                    text-sky-500
                    cursor-pointer
                    hover:text-sky-600
                    transition
                "
                />
            </div>
        </>
    )
}

export default Header;