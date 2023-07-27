"use client";

import useConversation from "@/app/hooks/useConversation";
import axios from "axios";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { HiPaperAirplane, HiPhoto } from "react-icons/hi2";
import MessageInput from "./MessageInput";
import { CldUploadButton } from "next-cloudinary";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import useDebounce from "@/app/hooks/useDebounce";
import QuotedMessageBox from "./QuotedMessageBox";
import useQuotedMessage from "@/app/hooks/useQuotedMessage";

const Form = () => {

    const { conversationId } = useConversation();
    const session = useSession();
    const {messageId: quotedMessageId, onClose, onClearData} = useQuotedMessage((state) => ({
        messageId: state.messageId, onClose: state.onClose, onClearData: state.onClearData
    }));

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: {
            errors,
        }
    } = useForm<FieldValues>({
        defaultValues: {
            message: ''
        }
    });

    const onSubmit: SubmitHandler<FieldValues> = (data) => {

        console.log("MESSAGE.ONSUBMIT >>", { ...data, conversationId });

        setValue('message', '', { shouldValidate: true });
        onClose(); // * Close the QuotedMessageBox
        onClearData(); // * Clear the store values
        
        axios.post("/api/messages", {
            ...data,
            conversationId,
            quotedMessageId
        })
    }

    const handleUpload = (result: any) => {
        console.log("handleUpload.result >>", result);
        axios.post('/api/messages', {
            image: result?.info?.secure_url,
            conversationId
        })
    }

    const message = watch('message');
    // console.log("WATCH.MESSAGE: ", message);

    const debouncedUserTyping = useDebounce(message, 200);
    useEffect(() => {

        if (debouncedUserTyping) {
            axios.post(`/api/userTyping`, {
                conversationId,
                name: session?.data?.user?.name,
                email: session?.data?.user?.email
            })
        }

    }, [debouncedUserTyping])

    return (
        <div className="border-t">
            <QuotedMessageBox />
            <div
                className="
            py-4
            px-4
            bg-white
            flex
            items-center
            gap-2
            lg:gap-4
            w-full
        "
            >

                <CldUploadButton
                    options={{ maxFiles: 1 }}
                    onUpload={handleUpload}
                    uploadPreset="oyoczbom"
                >
                    <HiPhoto size={30} className="text-sky-500" />
                </CldUploadButton>
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex items-center gap-2 lg:gap-4 w-full"
                >
                    <MessageInput
                        id="message"
                        register={register}
                        errors={errors}
                        required
                        placeholder="Write a message"
                    />

                    <button
                        type="submit"
                        className="
                    rounded-full
                    p-2
                    bg-sky-500
                    cursor-pointer
                    hover:bg-sky-600
                    transition
                "
                    >
                        <HiPaperAirplane size={18} className="text-white" />
                    </button>
                </form>
            </div>
        </div>

    )
}

export default Form;