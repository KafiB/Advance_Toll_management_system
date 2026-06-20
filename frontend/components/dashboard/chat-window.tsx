"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth-store";
import { messagesApi } from "@/lib/api/messages";
import { Send, MessageSquare, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ChatMessage, Conversation } from "@/lib/api/types";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────
//  chat-window.tsx
//  Full-featured real-time chat component.
//  Used by all three roles (admin/operator/user).
//
//  Features:
//  - Conversation list on left
//  - Messages on right
//  - Real-time via Socket.IO
//  - Typing indicator
//  - Online status
//  - Unread count badges
// ─────────────────────────────────────────────────────

const roleColors: Record<string, string> = {
  admin: "bg-primary/10 text-primary",
  operator: "bg-blue-500/10 text-blue-600",
  user: "bg-emerald-500/10 text-emerald-600",
};

export function ChatWindow() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ── Fetch conversations ───────────────────────────────
  const { data: convsRes, isLoading: convsLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => messagesApi.getConversations(),
    refetchInterval: 10000, // refetch every 10s as fallback
  });

  const conversations = convsRes?.data?.conversations ?? [];

  // ── Fetch contacts (to start new conversations) ───────
  const { data: contactsRes } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => messagesApi.getContacts(),
  });

  const contacts = contactsRes?.data?.contacts ?? [];

  // ── Fetch messages for active conversation ────────────
  const { data: messagesRes, isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", activeConversationId],
    queryFn: () => messagesApi.getMessages(activeConversationId!),
    enabled: !!activeConversationId,
  });

  useEffect(() => {
    if (messagesRes?.data?.messages) {
      setMessages(messagesRes.data.messages);
    }
  }, [messagesRes]);

  // ── Socket.IO setup ───────────────────────────────────
  useEffect(() => {
    if (!token) return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected");
    });

    socket.on("receive_message", ({ conversationId, message: newMsg }: { conversationId: string; message: ChatMessage }) => {
      if (conversationId === activeConversationId) {
        setMessages((prev) => [...prev, newMsg]);
        // Mark as read immediately
        messagesApi.markAsRead(conversationId).catch(console.error);
      }
      // Refresh conversation list for unread count
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });

    socket.on("user_online", ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    });

    socket.on("user_offline", ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    socket.on("user_typing", ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => new Set([...prev, userId]));
    });

    socket.on("user_stop_typing", ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    socket.on("messages_seen", () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  // ── Auto-scroll to bottom ─────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message via socket ───────────────────────────
  const sendMessage = () => {
    if (!message.trim() || !activeConversationId || !socketRef.current) return;

    const content = message.trim();
    setMessage("");

    socketRef.current.emit(
      "send_message",
      { conversationId: activeConversationId, content },
      (response: { success: boolean; message?: ChatMessage }) => {
        if (response.success && response.message) {
          setMessages((prev) => [...prev, response.message!]);
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        } else {
          toast.error("Failed to send message");
        }
      }
    );

    // Stop typing indicator
    if (socketRef.current) {
      const activeConv = conversations.find((c) => c.conversationId === activeConversationId);
      if (activeConv) {
        socketRef.current.emit("stop_typing", {
          receiverId: activeConv.otherUser.id,
          conversationId: activeConversationId,
        });
      }
    }
  };

  // ── Typing indicator ──────────────────────────────────
  const handleTyping = (value: string) => {
    setMessage(value);

    if (!socketRef.current || !activeConversationId) return;

    const activeConv = conversations.find((c) => c.conversationId === activeConversationId);
    if (!activeConv) return;

    if (!isTyping) {
      setIsTyping(true);
      socketRef.current.emit("typing", {
        receiverId: activeConv.otherUser.id,
        conversationId: activeConversationId,
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current?.emit("stop_typing", {
        receiverId: activeConv.otherUser.id,
        conversationId: activeConversationId,
      });
    }, 1500);
  };

  // ── Start new conversation ────────────────────────────
  const { mutate: startConversation } = useMutation({
    mutationFn: (userId: string) => messagesApi.getOrCreateConversation(userId),
    onSuccess: (response) => {
      const convId = (response.data as { _id: string })?._id;
      if (convId) {
        setActiveConversationId(convId);
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }
    },
  });

  // ── Open conversation ─────────────────────────────────
  const openConversation = (conv: Conversation) => {
    setActiveConversationId(conv.conversationId);
    setMessages([]);
    // Mark as read
    messagesApi.markAsRead(conv.conversationId).catch(console.error);
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  };

  const activeConv = conversations.find(
    (c) => c.conversationId === activeConversationId
  );
  const isOtherUserTyping = activeConv
    ? typingUsers.has(activeConv.otherUser.id)
    : false;
  const isOtherUserOnline = activeConv
    ? onlineUsers.has(activeConv.otherUser.id)
    : false;

  return (
    <div className="flex h-[calc(100vh-8rem)] border rounded-xl overflow-hidden bg-card">
      {/* Left panel — conversations + contacts */}
      <div className="w-72 shrink-0 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Messages</h2>
        </div>

        <ScrollArea className="flex-1">
          {/* Active conversations */}
          {convsLoading ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.conversationId}
                  onClick={() => openConversation(conv)}
                  className={cn(
                    "w-full flex items-start gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent",
                    activeConversationId === conv.conversationId && "bg-accent"
                  )}
                >
                  <div className="relative shrink-0">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium",
                        roleColors[conv.otherUser.role] ?? "bg-muted"
                      )}
                    >
                      {conv.otherUser.name.charAt(0).toUpperCase()}
                    </div>
                    {onlineUsers.has(conv.otherUser.id) && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">
                        {conv.otherUser.name}
                      </p>
                      {conv.unreadCount > 0 && (
                        <Badge className="h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center shrink-0">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {conv.otherUser.role}
                    </p>
                    {conv.lastMessage && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv.lastMessage}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* New conversation — contact list */}
          {contacts.length > 0 && (
            <div className="px-3 pb-3">
              <p className="text-xs text-muted-foreground font-medium px-1 mb-2 mt-3">
                NEW CONVERSATION
              </p>
              {contacts
                .filter(
                  (c) =>
                    !conversations.some((conv) => conv.otherUser.id === c.id)
                )
                .map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => startConversation(contact.id)}
                    className="w-full flex items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-accent"
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium shrink-0",
                        roleColors[contact.role] ?? "bg-muted"
                      )}
                    >
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{contact.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {contact.role}
                      </p>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Right panel — message thread */}
      <div className="flex-1 flex flex-col">
        {!activeConversationId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="font-medium">Select a conversation</p>
            <p className="text-sm text-muted-foreground">
              Choose from existing conversations or start a new one
            </p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b">
              <div className="relative">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium",
                    roleColors[activeConv?.otherUser.role ?? "user"]
                  )}
                >
                  {activeConv?.otherUser.name.charAt(0).toUpperCase()}
                </div>
                {isOtherUserOnline && (
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-card" />
                )}
              </div>
              <div>
                <p className="font-medium text-sm">{activeConv?.otherUser.name}</p>
                <p className="text-xs text-muted-foreground">
                  {isOtherUserOnline ? (
                    <span className="text-emerald-600">Online</span>
                  ) : (
                    <span className="capitalize">{activeConv?.otherUser.role}</span>
                  )}
                </p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className={cn("h-10 max-w-[60%] rounded-2xl", i % 2 === 0 ? "ml-auto" : "")}
                    />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    No messages yet. Say hello!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg) => {
                    const senderId =
                      typeof msg.sender === "object"
                        ? (msg.sender as { _id: string })._id
                        : msg.sender;
                    const isMe = senderId === user?.id;

                    return (
                      <div
                        key={msg._id}
                        className={cn(
                          "flex",
                          isMe ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2 text-sm",
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted rounded-bl-sm"
                          )}
                        >
                          <p>{msg.content}</p>
                          <p
                            className={cn(
                              "text-[10px] mt-1",
                              isMe
                                ? "text-primary-foreground/70 text-right"
                                : "text-muted-foreground"
                            )}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing indicator */}
                  {isOtherUserTyping && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                        <div className="flex gap-1 items-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message input */}
            <div className="px-4 py-3 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!message.trim()}
                  size="icon"
                >
                  <Send className="h-4 w-4" strokeWidth={1.75} />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}