import {create} from 'zustand';

interface QuoteMessageStore {
    isOpen: boolean;
    name?: string | null;
    messageId?: string | null;
    messageContent?: string | null;
    messageContentType?: string | null;
    onOpen: () => void;
    onClose: () => void;
    onSetData: (data: any) => void;
    onClearData: () => void;
}

const useQuotedMessage = create<QuoteMessageStore>((set) => ({
    isOpen: false,
    name: null,
    messageId: null,
    messageContent: null,
    messageContentType: null,
    onOpen: () => set({ isOpen: true }),
    onClose: () => set({isOpen: false}),
    onSetData: (data: any) => set((state) => ({ ...state, name: data.name, messageId: data.messageId, messageContent: data.messageContent, messageContentType: data.messageContentType})),
    onClearData: () => set({name: null, messageId: null, messageContent: null, messageContentType: null})
}));

export default useQuotedMessage;