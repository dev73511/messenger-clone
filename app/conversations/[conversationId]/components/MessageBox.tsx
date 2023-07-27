"use client";

import Avatar from "@/app/components/Avatar";
import { FullMessageType } from "@/app/types";
import clsx from "clsx";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import Image from "next/image";
import React, { useState } from "react";
import ImageModal from "./ImageModal";
import useQuotedMessage from "@/app/hooks/useQuotedMessage";
import { isNull } from "lodash";

interface MessageBoxProps {
    data: FullMessageType;
    isLast?: boolean;

}

const MessageBox: React.FC<MessageBoxProps> = ({
    data,
    isLast
}) => {

    const session = useSession();
    const [imageModalOpen, setImageModalOpen] = useState(false);
    // console.log("SESSION>>", session);
    // console.log("MessageBoxDATA>>", data);

    const { onOpen, onSetData } = useQuotedMessage();


    const isOwn = session?.data?.user?.email === data?.sender?.email;
    const isQuotedMessage = isNull(data.quotedMessageId);
    const isOwnQuotedMessage = session?.data?.user?.email === data?.quotedMessage?.sender?.email;

    const seenList = (data.seen || [])
        .filter((user) => user.email !== data?.sender?.email)
        .map((user) => user.name)
        .join(", ");

    const container = clsx(`
        flex gap-3 p-4
    `, isOwn && "justify-end");

    const avatar = clsx(isOwn && "order-2");

    const body = clsx(
        "flex flex-col gap-2",
        isOwn && "items-end"
    );

    const message = clsx(
        "text-sm w-fit overflow-hidden",
        (isOwn && isQuotedMessage) ? 'bg-sky-500/75 text-white  py-1' : 'bg-gray-100',
        (isOwn && !isQuotedMessage) ? 'bg-sky-500/75 text-white  py-1' : 'bg-gray-100',
        data.image ? 'rounded-md p-0' : 'rounded-lg py-2 px-3'
    );

    const quotedMessageContainer = clsx(
        "py-4 px-4 border-l-4 w-full rounded-lg",
        (isOwn) ? 'bg-sky-500 border-white' : 'bg-gray-200 border-stone-600',
    )

    const quotedMessageContainerText = clsx(
        "text-sm font-light",
        (isOwn) ? 'text-white' : '',
    )

    const handleQuotedMessage = (data: any) => {
        try {
            // console.log("handleQuotedMessage >>", data);
            onSetData(data);
            onOpen();
        } catch (error: any) {
            console.log("handleQuotedMessage Error: ", error.message);
        }
    }

    let bodyContent;

    if (!isNull(data.quotedMessageId)) {
        bodyContent = (
            <div>
                <div className="
                flex
                items-center
                gap-2
                lg:gap-4
                ">
                    <div className={quotedMessageContainer}>
                        <div className={quotedMessageContainerText}>{isOwnQuotedMessage ? "You" : data.quotedMessage?.sender?.name}</div>
                        {(data.quotedMessage?.body !== null) && (
                            <div className={quotedMessageContainerText}>{data.quotedMessage?.body}</div>
                        )}

                        {(data.quotedMessage?.image !== null) && (
                            <Image
                                src={data.quotedMessage?.image ?? ""}
                                alt="img"
                                className="object-cover w-fit rounded-md"
                                width={50}
                                height={50}
                            />
                        )}
                    </div>

                </div>
                <div className="pt-2">{data.body}</div>
            </div>
        )
    }

    if (isNull(data.quotedMessageId)) {
        bodyContent = (
            <div>{data.body}</div>
        )
    }

    return (
        <>
            <div className={container} data-name="container">
                <div className={avatar}>
                    <Avatar user={data.sender} />
                </div>
                <div className={body}>
                    <div className="flex items-center gap-1">
                        <div className="text-sm text-gray-500">
                            {data.sender.name}
                        </div>
                        <div className="text-xs text-gray-400">
                            {format(new Date(data.createdAt), 'p')}
                        </div>
                    </div>

                    <div className={message}>
                        <ImageModal
                            src={data.image}
                            isOpen={imageModalOpen}
                            onClose={() => setImageModalOpen(false)}
                        />
                        {
                            data.image ? (
                                <Image
                                    onClick={() => setImageModalOpen(true)}
                                    alt="image"
                                    height="288"
                                    width="288"
                                    src={data.image}
                                    className="
                                    object-cover
                                    cursor-pointer
                                    hover:scale-110
                                    transition
                                    translate
                                "
                                />
                            ) : (
                                bodyContent
                            )
                        }
                    </div>
                    <div className="
                    text-sm 
                    text-gray-400 
                    bg-gray-100 
                    w-fit py-1 
                    px-3 
                    rounded-full
                    border-gray-200
                    cursor-pointer
                    shadow 
                    hover:shadow-lg
                "
                        onClick={() => handleQuotedMessage({
                            name: isOwn ? "You" : data.sender.name,
                            messageId: data.id,
                            messageContent: data.body ?? data.image,
                            messageContentType: data.body ? "TEXT" : "IMAGE"
                        })}
                    >
                        Reply
                    </div>

                    {
                        isLast && isOwn && seenList.length > 0 && (
                            <div
                                className="
                            text-xs
                            font-light
                            text-gray-500
                        "
                            >
                                {`Seen by ${seenList}`}
                            </div>
                        )
                    }
                </div>
            </div>
        </>
    )
}

export default MessageBox;