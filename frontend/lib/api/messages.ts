import api from "./axios";
import { ApiSuccessResponse, Conversation, ChatMessage } from "./types";

export const messagesApi = {
  getContacts: async () => {
    const { data } = await api.get<ApiSuccessResponse<{ contacts: { id: string; name: string; email: string; role: string }[] }>>(
      "/messages/contacts"
    );
    return data;
  },

  getConversations: async () => {
    const { data } = await api.get<ApiSuccessResponse<{ conversations: Conversation[] }>>(
      "/messages/conversations"
    );
    return data;
  },

  getOrCreateConversation: async (userId: string) => {
    const { data } = await api.post<ApiSuccessResponse<{ _id: string; participants: unknown[] }>>(
      `/messages/conversations/${userId}`
    );
    return data;
  },

  getMessages: async (conversationId: string, page = 1) => {
    const { data } = await api.get<ApiSuccessResponse<{ messages: ChatMessage[] }>>(
      `/messages/${conversationId}`,
      { params: { page, limit: 50 } }
    );
    return data;
  },

  sendMessage: async (conversationId: string, content: string) => {
    const { data } = await api.post<ApiSuccessResponse<ChatMessage>>(
      `/messages/${conversationId}`,
      { content }
    );
    return data;
  },

  markAsRead: async (conversationId: string) => {
    const { data } = await api.put<ApiSuccessResponse>(
      `/messages/${conversationId}/read`
    );
    return data;
  },

  getUnreadCount: async () => {
    const { data } = await api.get<ApiSuccessResponse<{ unreadCount: number }>>(
      "/messages/unread-count"
    );
    return data;
  },
};