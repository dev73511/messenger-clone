'use client';

import useQuotedMessage from "@/app/hooks/useQuotedMessage";
import { IoClose } from "react-icons/io5";
import Image from "next/image";


const QuotedMessageBox = () => {

    const { isOpen, onClose, name, messageId, messageContent, messageContentType } = useQuotedMessage((state) => ({
        isOpen: state.isOpen,
        onClose: state.onClose,
        name: state.name,
        messageId: state.messageId,
        messageContent: state.messageContent,
        messageContentType: state.messageContentType
    }));
    // console.log("QuotedMessageBox =>", "messageContent: ", messageContent)

    if (!isOpen) {
        return null;
    }

    return (
        <div className="
                py-2
                pl-14
                pr-4
                bg-white
                flex
                items-center
                gap-2
                lg:gap-4
                w-full
                ">
            <div className="
                        bg-gray-100 
                        py-4
                        px-4
                        border-l-4 
                        border-blue-500
                        w-full
                        rounded-md

                    ">
                <div className="text-sm text-blue-500">{name}</div>
                {messageContentType && messageContentType === 'TEXT' && (
                    <div className="text-sm font-light text-gray-500">{messageContent}</div>
                )}

                {messageContentType && messageContentType === 'IMAGE' && (
                    <div className="w-10 h-10 ">
                        <Image 
                            src={messageContent ?? ""}
                            alt="img"
                            className="object-cover w-fit"
                            width={50}
                            height={50}
                        />
                    </div>
                )}

            </div>

            <div
                className="
                        py-2
                        px-2
                        rounded-full
                        cursor-pointer
                        "
                onClick={onClose}
            >
                <IoClose size={20} />

            </div>
        </div>
    )
}


export default QuotedMessageBox