"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/store/auth-store";
import { messagesApi } from "@/lib/api/messages";
import {
  Bell,
  MessageSquare,
  CheckCheck,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Conversation } from "@/lib/api/types";

// ─────────────────────────────────────────────────────
//  notifications/page.tsx
//  Shows unread message notifications.
//  Clicking a notification opens the messages page.
//  "Mark all read" clears all unread counts.
// ─────────────────────────────────────────────────────

const roleColors: Record<string, string> = {
  admin: "bg-primary/10 text-primary",
  operator: "bg-blue-500/10 text-blue-600",
  user: "bg-emerald-500/10 text-emerald-600",
};

export default function NotificationsPage() {
  const user = useAuthStore((state) => state.user);
  const role = user?.role ?? "user";
  const queryClient = useQueryClient();

  const { data: convsRes, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => messagesApi.getConversations(),
  });

  const conversations = (convsRes?.data?.conversations ?? []) as Conversation[];
  const unread = conversations.filter((c) => c.unreadCount > 0);
  const read = conversations.filter((c) => c.unreadCount === 0);

  // Mark all as read
  const { mutate: markAllRead, isPending: marking } = useMutation({
    mutationFn: async () => {
      await Promise.all(
        unread.map((c) => messagesApi.markAsRead(c.conversationId))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-heading tracking-tight">
            Notifications
          </h1>
          <p className="text-muted-foreground mt-1">
            {unread.length > 0
              ? `${unread.length} unread notification${unread.length !== 1 ? "s" : ""}`
              : "You are all caught up"}
          </p>
        </div>

        {unread.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead()}
            disabled={marking}
          >
            <CheckCheck className="h-4 w-4" strokeWidth={1.75} />
            Mark all read
          </Button>
        )}
      </div>

      {/* Unread notifications */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Bell className="h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-medium">No notifications yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                When you receive messages, they will appear here.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href={`/dashboard/${role}/messages`}>
                <MessageSquare className="h-4 w-4" strokeWidth={1.75} />
                Go to Messages
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Unread */}
          {unread.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Unread
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 p-2">
                {unread.map((conv) => (
                  <Link
                    key={conv.conversationId}
                    href={`/dashboard/${role}/messages`}
                    className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-accent"
                  >
                    <div className="relative shrink-0">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium",
                          roleColors[conv.otherUser.role] ?? "bg-muted"
                        )}
                      >
                        {conv.otherUser.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm">
                          {conv.otherUser.name}
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(conv.lastMessageAt)}
                          </span>
                          <Badge className="h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center">
                            {conv.unreadCount}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">
                        {conv.otherUser.role}
                      </p>
                      {conv.lastMessage && (
                        <p className="text-xs text-foreground/80 truncate mt-1">
                          {conv.lastMessage}
                        </p>
                      )}
                    </div>

                    <ArrowRight
                      className="h-4 w-4 text-muted-foreground shrink-0 mt-1"
                      strokeWidth={1.75}
                    />
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Read / earlier */}
          {read.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Earlier
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 p-2">
                {read.map((conv) => (
                  <Link
                    key={conv.conversationId}
                    href={`/dashboard/${role}/messages`}
                    className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-accent opacity-70"
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                        roleColors[conv.otherUser.role] ?? "bg-muted"
                      )}
                    >
                      {conv.otherUser.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm">
                          {conv.otherUser.name}
                        </p>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">
                        {conv.otherUser.role}
                      </p>
                      {conv.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {conv.lastMessage}
                        </p>
                      )}
                    </div>

                    <ArrowRight
                      className="h-4 w-4 text-muted-foreground shrink-0 mt-1"
                      strokeWidth={1.75}
                    />
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}