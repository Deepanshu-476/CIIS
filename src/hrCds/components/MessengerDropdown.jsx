import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import EmojiPicker, { Categories, EmojiStyle, SkinTonePickerLocation, Theme } from "emoji-picker-react";
import {
  Search,
  MoreHorizontal,
  Maximize2,
  SquarePen,
  X,
  ChevronLeft,
  Send,
  MessageSquare,
  Users,
  CheckCheck,
  Check,
  Smile,
  Sparkles,
  MessageCircle,
  Phone,
  Video,
  Mic,
  Camera,
  FileText,
  Images,
  Paperclip,
  MoreVertical,
  Trash2,
  Reply,
} from "lucide-react";
import {
  getConversations,
  getCompanyUsers,
  getCompanyGroups,
  createConversation,
  createGroupConversation,
  getMessages,
  sendMessage,
  markMessageSeen,
  deleteMessageForMe,
  deleteMessageForEveryone,
} from "../../services/chatService";
import TaskDetailsModal from "./TaskDetailsModal";
import { getClientChatTask, addClientChatRemark, openClientConversation } from "../../services/chatService";
import ChatMentionInput from "../../chat/ChatMentionInput";
import { mentionMembers, reconcileMentions, mentionSegments } from "../../chat/mentionUtils";
import { attachmentLabel, attachmentSource, attachmentUrls, resolveAvatarUrl } from "../../chat/messageUtils";
import { describeCallMessage, isCallMessage } from "../../chat/callMessage";
import { API_URL_IMG } from "../../config";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/useAuth";
import { useCall } from "../../context/CallContext";
import "./MessengerDropdown.css";

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay === 1) return "1d";
  if (diffDay < 7) return `${diffDay}d`;
  if (diffWeek < 52) return `${diffWeek}w`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
};

const formatMessageTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const getEntityId = (value) => {
  if (!value) return "";
  if (typeof value === "object") {
    return (value._id || value.id || value.userId || "").toString();
  }
  return value.toString();
};

export const hasCompanyChatAccess = () => {
  try {
    const storage = typeof window !== "undefined" && window?.localStorage
      ? window.localStorage
      : (typeof localStorage !== "undefined" ? localStorage : null);
    if (!storage) return true;
    const raw = storage.getItem("companyDetails");
    if (!raw) return true;
    const company = JSON.parse(raw);
    const allowed = Array.isArray(company?.allowedPages) ? company.allowedPages : [];
    if (!allowed.length) return true;
    const normalize = v => String(v || "").trim().replace(/^\/+/, "").toLowerCase();
    const set = new Set(allowed.map(normalize));
    return set.has("chat") || set.has("ciisuser/chat");
  } catch {
    return true;
  }
};

const getConversationId = (value) => (
  value?.conversationId || value?.conversation?._id || value?._id || value?.id || ""
).toString();

const getMessageSenderId = (message) => getEntityId(message?.sender || message?.senderId);

const getMessagePreview = (message) => {
  if (!message) return "Start conversation";
  if (message.deletedForEveryone) return "This message was deleted";
  if (isCallMessage(message)) return describeCallMessage(message).text;
  if (message.text) return message.text;
  if (message.file) {
    if (String(message.fileType || "").startsWith("image/")) return "Photo";
    if (String(message.fileType || "").startsWith("video/")) return "Video";
    if (String(message.fileType || "").startsWith("audio/")) return "Voice message";
    return "Attachment";
  }
  return "New message";
};

const sortConversationItems = (items = []) => [...items].sort((first, second) => {
  const firstTime = new Date(first?.lastMessage?.createdAt || first?.updatedAt || first?.createdAt || 0).getTime();
  const secondTime = new Date(second?.lastMessage?.createdAt || second?.updatedAt || second?.createdAt || 0).getTime();
  if (secondTime !== firstTime) return secondTime - firstTime;
  return getConversationId(first).localeCompare(getConversationId(second));
});

const MAX_WIDGET_FILE_SIZE = 50 * 1024 * 1024;

let memoryCachedConversations = null;
let memoryCachedUsers = null;
let memoryCachedGroups = null;

export const clearMessengerMemoryCache = () => {
  memoryCachedConversations = null;
  memoryCachedUsers = null;
  memoryCachedGroups = null;
};

const CHAT_EMOJI_CATEGORIES = [
  { category: Categories.SMILEYS_PEOPLE, name: "Smileys & People" },
  { category: Categories.ANIMALS_NATURE, name: "Animals & Nature" },
  { category: Categories.FOOD_DRINK, name: "Food & Drink" },
  { category: Categories.ACTIVITIES, name: "Activities" },
  { category: Categories.TRAVEL_PLACES, name: "Travel" },
  { category: Categories.OBJECTS, name: "Objects" },
  { category: Categories.SYMBOLS, name: "Symbols" },
  { category: Categories.FLAGS, name: "Flags" },
];

const getAttachmentKind = (file) => {
  const type = String(file?.type || "").toLowerCase();
  const name = String(file?.name || "").toLowerCase();
  if (type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(name)) return "image";
  if (type.startsWith("video/") || /\.(mp4|webm|ogg|mov|m4v|avi|mkv)$/i.test(name)) return "video";
  if (type.startsWith("audio/") || /\.(mp3|wav|m4a|aac|oga|opus|flac)$/i.test(name)) return "audio";
  return "document";
};

const formatFileSize = (bytes = 0) => {
  const size = Number(bytes) || 0;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const MessengerDropdown = ({ isOpen, onClose, onUnreadChange }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { socket } = useSocket();
  const { startCall } = useCall();

  const currentUserId = (currentUser?._id || currentUser?.id || "").toString();

  const isClientUser = useMemo(() => {
    const rawRole = currentUser?.companyRole || currentUser?.role || currentUser?.jobRoleName || currentUser?.jobRole || currentUser?.designation || '';
    const roleName = typeof rawRole === 'object' ? (rawRole.roleName || rawRole.name || rawRole.title || '') : String(rawRole);
    return (
      roleName.trim().toLowerCase() === 'client' ||
      String(currentUser?.companyRole || '').trim().toLowerCase() === 'client' ||
      window.location.pathname.startsWith('/client')
    );
  }, [currentUser]);

  // Controlled or internal open state
  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const isWidgetOpen = isOpen !== undefined ? isOpen : isOpenInternal;

  // Navigation / View State: "list" | "chat"
  const [activeView, setActiveView] = useState("list");
  const [selectedChat, setSelectedChat] = useState(null); // Active conversation or user
  const [activeConversationId, setActiveConversationId] = useState(null);

  // Data States
  const [conversations, setConversations] = useState(() => memoryCachedConversations || []);
  const [chatLoadError, setChatLoadError] = useState("");
  const [companyUsers, setCompanyUsers] = useState(() => memoryCachedUsers || []);
  const [companyGroups, setCompanyGroups] = useState(() => memoryCachedGroups || []);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(() => !memoryCachedConversations || memoryCachedConversations.length === 0);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "unread" | "projects" | "clients"
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [openMessageMenuId, setOpenMessageMenuId] = useState("");
  const [confirmDeleteMessage, setConfirmDeleteMessage] = useState(null);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  // Input & Sending
  const [inputText, setRawInputText] = useState("");
  const [messageMentions, setMessageMentions] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [clientTask, setClientTask] = useState(null);
  const clientRemarkRequests = useRef(new Map());
  const setInputText = (next, mentions) => {
    setMessageMentions(mentions ?? reconcileMentions(inputText, next, messageMentions));
    setRawInputText(next);
  };
  const activeConversation = conversations.find(item => String(item._id) === String(activeConversationId)) || selectedChat?.conversation;
  const mentionCandidates = mentionMembers(
    activeConversation?.members || selectedChat?.members || (!selectedChat?.isGroup ? [currentUser, selectedChat?.targetUser || selectedChat] : []),
    [...companyUsers, currentUser, ...(selectedChat?.members || [])]
  );
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);

  const messagesEndRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const documentInputRef = useRef(null);
  const mediaInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const receivedMessageIdsRef = useRef(new Set());
  const initialDataRequested = useRef(false);

  useEffect(() => {
    if (!pendingAttachment?.file) {
      setAttachmentPreviewUrl("");
      return undefined;
    }
    const url = URL.createObjectURL(pendingAttachment.file);
    setAttachmentPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingAttachment]);

  // Auto-scroll to bottom of messages
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  const handleOpenWidget = () => {
    window.dispatchEvent(new CustomEvent("close-support-widget"));
    setIsOpenInternal(true);
  };

  const handleCloseWidget = () => {
    if (onClose) onClose();
    setIsOpenInternal(false);
  };

  const getSelectedChatTarget = () => {
    if (!selectedChat) return null;
    if (selectedChat.targetUser) return selectedChat.targetUser;
    if (selectedChat.conversation) {
      if (selectedChat.conversation.isGroup || selectedChat.isGroup) return selectedChat.conversation;
      return (selectedChat.conversation.members || []).find((member) => (
        getEntityId(member) !== currentUserId
      )) || selectedChat.conversation;
    }
    if (selectedChat.isGroup) return selectedChat;
    if (Array.isArray(selectedChat.members)) {
      return selectedChat.members.find((member) => (
        getEntityId(member) !== currentUserId
      )) || selectedChat;
    }
    return selectedChat;
  };

  useEffect(() => {
    const handleCloseFromSupport = () => {
      setIsOpenInternal(false);
      if (onClose) onClose();
    };
    window.addEventListener("close-messenger-widget", handleCloseFromSupport);
    return () => window.removeEventListener("close-messenger-widget", handleCloseFromSupport);
  }, [onClose]);

  // Close when clicking outside the widget
  useEffect(() => {
    if (!isWidgetOpen) return;
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        handleCloseWidget();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isWidgetOpen]);

  // Total unread count
  const totalUnread = useMemo(() => {
    return conversations.reduce((sum, c) => sum + (Number(c.unreadCount) || 0), 0);
  }, [conversations]);

  // Fetch initial conversations, users, and groups. Every page mounts this
  // widget for the unread badge, so contacts and groups wait for the first open.
  const contactsRequested = useRef(false);
  const loadChatData = async ({ withContacts = contactsRequested.current } = {}) => {
    try {
      setChatLoadError("");
      if (!memoryCachedConversations || memoryCachedConversations.length === 0) {
        setLoadingConversations(true);
      }

      // 1. Fetch conversations immediately and update state as soon as it returns
      // (Do NOT wait for users or groups to finish before showing conversations!)
      const convPromise = getConversations()
        .then((convRes) => {
          const convList = convRes.data?.conversations || [];
          const sorted = sortConversationItems(convList);
          memoryCachedConversations = sorted;
          setConversations(sorted);

          // Compute total unread
          const unreadTotal = convList.reduce((sum, c) => sum + (Number(c.unreadCount) || 0), 0);
          onUnreadChange?.(unreadTotal);
          return sorted;
        })
        .catch((err) => {
          console.warn("Failed to load chat conversations:", err);
          setChatLoadError("Chats could not load. Please retry.");
          return [];
        })
        .finally(() => {
          setLoadingConversations(false);
        });

      // 2. Fetch company users and groups concurrently without blocking conversation display
      if (!withContacts) {
        await convPromise;
        return;
      }
      contactsRequested.current = true;
      const usersPromise = getCompanyUsers()
        .then((usersRes) => {
          const list = usersRes.data?.users || [];
          memoryCachedUsers = list;
          setCompanyUsers(list);
          return list;
        })
        .catch(() => { setChatLoadError("Some contacts could not load. Please retry."); return []; });

      const groupsPromise = getCompanyGroups()
        .then((groupsRes) => {
          const list = groupsRes.data?.groups || groupsRes.data?.data || [];
          memoryCachedGroups = list;
          setCompanyGroups(list);
          return list;
        })
        .catch(() => { setChatLoadError("Some groups could not load. Please retry."); return []; });

      await Promise.allSettled([convPromise, usersPromise, groupsPromise]);
    } catch (err) {
      console.warn("Failed to load chat data:", err);
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    if (isWidgetOpen || !initialDataRequested.current) {
      initialDataRequested.current = true;
      loadChatData({ withContacts: isWidgetOpen || contactsRequested.current });
    }
  }, [isWidgetOpen]);

  // Socket setup for real-time presence & messages
  useEffect(() => {
    if (!socket) return;

    const handleOnline = (users) => {
      const ids = (Array.isArray(users) ? users : []).map(getEntityId).filter(Boolean);
      setOnlineUserIds(ids);
    };

    const handleUserOnline = (data) => {
      const uid = getEntityId(data?.user || data?.userId || data);
      if (uid) setOnlineUserIds((prev) => Array.from(new Set([...prev, uid])));
    };

    const handleUserOffline = (data) => {
      const uid = getEntityId(data?.user || data?.userId || data);
      if (uid) setOnlineUserIds((prev) => prev.filter((id) => id !== uid));
    };

    const updateConversationFromMessage = (msg) => {
      const msgConvId = getConversationId(msg);
      if (!msgConvId) return;
      const messageId = (msg?._id || msg?.id || "").toString();
      const alreadyHandled = messageId && receivedMessageIdsRef.current.has(messageId);
      if (messageId) receivedMessageIdsRef.current.add(messageId);
      const isIncoming = getMessageSenderId(msg) !== currentUserId;
      const isViewing = activeConversationId && msgConvId === activeConversationId;

      setConversations(prev => sortConversationItems(prev.map(conv => (
        getConversationId(conv) === msgConvId
          ? {
              ...conv,
              lastMessage: msg,
              updatedAt: msg.createdAt || conv.updatedAt,
              unreadCount: isIncoming && !isViewing && !alreadyHandled
                ? (Number(conv.unreadCount) || 0) + 1
                : (isViewing ? 0 : conv.unreadCount),
            }
          : conv
      ))));
    };

    const handleReceiveMessage = (msg) => {
      const msgConvId = (msg?.conversationId || msg?.conversation?._id || "").toString();
      updateConversationFromMessage(msg);

      // If viewing this conversation currently
      if (activeConversationId && msgConvId === activeConversationId) {
        const incomingId = String(msg?._id || msg?.id || "");
        setMessages((prev) => {
          if (incomingId && prev.some((m) => String(m._id || m.id || "") === incomingId)) return prev;
          return [...prev, msg];
        });
        setTimeout(() => scrollToBottom(true), 50);

        // Mark as seen
        if (msg._id && getEntityId(msg.sender) !== currentUserId) {
          markMessageSeen(msg._id).catch(() => {});
          socket.emit("chat:seen", {
            messageId: msg._id,
            senderId: getEntityId(msg.sender),
          });
        }
      }

    };

    const handleUnreadUpdate = (data = {}) => {
      const conversationId = data.conversationId?.toString();
      if (!conversationId) {
        loadChatData();
        return;
      }
      setConversations(prev => sortConversationItems(prev.map(conv => (
        getConversationId(conv) === conversationId
          ? { ...conv, unreadCount: Number(data.count) || 0 }
          : conv
      ))));
    };

    socket.on("chat:online-users", handleOnline);
    socket.on("chat:user-online", handleUserOnline);
    socket.on("chat:user-offline", handleUserOffline);
    socket.on("chat:receive-message", handleReceiveMessage);
    socket.on("chat:unread-update", handleUnreadUpdate);
    const handleMembership = async (data) => {
      await loadChatData();
      if (String(data.conversationId) !== String(activeConversationId)) return;
      try { await getMessages(activeConversationId, { limit: 1 }); }
      catch { setSelectedChat(null); setActiveConversationId(null); setClientTask(null); setReplyingTo(null); setMessages([]); setActiveView("list"); }
    };
    socket.on("chat:project-membership-updated", handleMembership);
    socket.on("chat:conversation-updated", loadChatData);

    // The socket often connects after this effect runs; ask again on every (re)connect.
    const requestOnlineUsers = () => socket.emit("chat:get-online-users", handleOnline);
    socket.on("connect", requestOnlineUsers);
    if (socket.connected) requestOnlineUsers();

    return () => {
      socket.off("chat:online-users", handleOnline);
      socket.off("chat:user-online", handleUserOnline);
      socket.off("chat:user-offline", handleUserOffline);
      socket.off("chat:receive-message", handleReceiveMessage);
      socket.off("chat:unread-update", handleUnreadUpdate);
      socket.off("chat:project-membership-updated", handleMembership);
      socket.off("chat:conversation-updated", loadChatData);
      socket.off("connect", requestOnlineUsers);
    };
  }, [socket, activeConversationId, currentUserId]);

  useEffect(() => {
    onUnreadChange?.(totalUnread);
  }, [totalUnread, onUnreadChange]);

  // Handle opening a chat (conversation or colleague)
  const handleSelectChat = async (target) => {
    setReplyingTo(null);
    setMessageMentions([]);
    setSelectedChat(target);
    setActiveView("chat");
    setLoadingMessages(true);
    setInputText("");
    setShowReactions(false);
    setShowAttachmentMenu(false);

    try {
      setClientTask(null);
      let convId = target?.conversation?._id || (target?.members ? target?._id : null);

      // If selecting a user without an existing conversation, create/find it
      if (!convId && !target.isGroup) {
        const targetId = getEntityId(target);
        const res = await createConversation(targetId);
        convId = res.data?.conversation?._id || res.data?._id;
      } else if (!convId && target.isGroup) {
        const groupId = getEntityId(target);
        const res = target.clientId ? await openClientConversation(target.clientId) : await createGroupConversation(groupId);
        convId = res.data?.conversation?._id || res.data?._id;
      }

      if (convId) {
        setActiveConversationId(convId);
        socket?.emit("chat:join-conversation", { conversationId: convId });

        const msgRes = await getMessages(convId);
        const fetchedMessages = msgRes.data?.messages || [];
        // Loading the messages marks them all seen on the server; one call per
        // message here only repeated that work (up to 50 requests per open).
        setMessages(fetchedMessages);
      }
    } catch (err) {
      console.warn("Error starting chat:", err);
    } finally {
      setLoadingMessages(false);
      setTimeout(() => {
        scrollToBottom(false);
        inputRef.current?.focus();
      }, 80);
    }
  };

  // Handle returning to list view
  const handleBackToList = () => {
    if (activeConversationId) {
      socket?.emit("chat:leave-conversation", { conversationId: activeConversationId });
    }
    setActiveView("list");
    setSelectedChat(null);
    setActiveConversationId(null);
    setShowReactions(false);
    setShowAttachmentMenu(false);
    loadChatData();
  };

  // Handle sending a message
  const handleSendMessage = async (textToSend = inputText) => {
    const text = String(textToSend || "");
    if (!text.trim() || !activeConversationId || isSending || sendingRef.current) return;

    sendingRef.current = true;
    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append("conversationId", activeConversationId);
      formData.append("text", text);
      formData.append("mentions", JSON.stringify(messageMentions));
      if (replyingTo?._id) formData.append("replyToMessageId", replyingTo._id);

      const res = await sendMessage(formData);
      const sentMsg = res.data?.message || res.data;
      setInputText("", []);
      setReplyingTo(null);

      // Add to local state only if not already received via socket
      if (sentMsg) {
        const sentId = String(sentMsg._id || sentMsg.id || "");
        setMessages((prev) => {
          if (sentId && prev.some((m) => String(m._id || m.id || "") === sentId)) {
            return prev;
          }
          return [...prev, sentMsg];
        });
      }

      setTimeout(() => scrollToBottom(true), 50);
      loadChatData();
    } catch (err) {
      console.warn("Failed to send message:", err);
    } finally {
      setIsSending(false);
      sendingRef.current = false;
      inputRef.current?.focus();
    }
  };

  const validateAndPreviewFile = (file) => {
    setAttachmentError("");
    if (!file) return;
    if (file.size > MAX_WIDGET_FILE_SIZE) {
      setAttachmentError(`File size must be ${formatFileSize(MAX_WIDGET_FILE_SIZE)} or less.`);
      return;
    }
    setPendingAttachment({
      file,
      kind: getAttachmentKind(file),
    });
    setShowAttachmentMenu(false);
  };

  const handleSendFile = async () => {
    const file = pendingAttachment?.file;
    if (!file || !activeConversationId || isSending || sendingRef.current) return;

    sendingRef.current = true;
    setIsSending(true);
    setShowAttachmentMenu(false);
    try {
      const formData = new FormData();
      formData.append("conversationId", activeConversationId);
      formData.append("file", file);
      if (replyingTo?._id) formData.append("replyToMessageId", replyingTo._id);
      formData.append("fileType", file.type || "application/octet-stream");
      formData.append("fileName", file.name || `attachment-${Date.now()}`);

      const res = await sendMessage(formData);
      const sentMsg = res.data?.message || res.data;
      if (sentMsg) {
        const sentId = String(sentMsg._id || sentMsg.id || "");
        setMessages((prev) => (
          (sentId && prev.some((message) => String(message._id || message.id || "") === sentId))
            ? prev
            : [...prev, sentMsg]
        ));
      }
      setTimeout(() => scrollToBottom(true), 50);
      loadChatData();
      setPendingAttachment(null);
      setReplyingTo(null);
    } catch (err) {
      console.warn("Failed to send attachment:", err);
      setAttachmentError("Unable to send attachment. Please try again.");
    } finally {
      setIsSending(false);
      sendingRef.current = false;
      inputRef.current?.focus();
    }
  };

  const handleFileInputChange = (event) => {
    const [file] = Array.from(event.target.files || []);
    event.target.value = "";
    if (file) validateAndPreviewFile(file);
  };

  // Quick reaction emoji click
  const handleReactionClick = (emojiData) => {
    const emoji = emojiData?.emoji || "";
    if (!emoji) return;
    const input = inputRef.current;
    const start = typeof input?.selectionStart === "number" ? input.selectionStart : inputText.length;
    const end = typeof input?.selectionEnd === "number" ? input.selectionEnd : start;
    const nextText = `${inputText.slice(0, start)}${emoji}${inputText.slice(end)}`;
    setInputText(nextText);
    setShowReactions(false);
    requestAnimationFrame(() => {
      input?.focus();
      const nextCursor = start + emoji.length;
      input?.setSelectionRange?.(nextCursor, nextCursor);
    });
  };

  const handleDeleteForMe = async (message) => {
    if (!message?._id || isSending) return;
    setIsSending(true);
    try {
      await deleteMessageForMe(message._id);
      setMessages((prev) => prev.filter((item) => item._id !== message._id));
      socket?.emit("chat:delete-for-me", { messageId: message._id, conversationId: activeConversationId });
      loadChatData();
    } catch (error) {
      setAttachmentError(error?.response?.data?.message || "Unable to delete this message. Please try again.");
    } finally {
      setOpenMessageMenuId("");
      setIsSending(false);
    }
  };

  const confirmDeleteForEveryone = async () => {
    const message = confirmDeleteMessage;
    if (!message?._id || isSending) return;
    setIsSending(true);
    try {
      await deleteMessageForEveryone(message._id);
      setMessages((prev) => prev.map((item) => (
        item._id === message._id ? { ...item, deletedForEveryone: true, text: "" } : item
      )));
      socket?.emit("chat:delete-for-everyone", { messageId: message._id, conversationId: activeConversationId });
      loadChatData();
    } catch (error) {
      setAttachmentError(error?.response?.data?.message || "Unable to delete this message. Please try again.");
    } finally {
      setConfirmDeleteMessage(null);
      setOpenMessageMenuId("");
      setIsSending(false);
    }
  };

  // Navigate to full chat page
  const handleOpenFullPage = () => {
    handleCloseWidget();
    if (selectedChat) {
      const target = getSelectedChatTarget();
      const uid = getEntityId(target || selectedChat);
      navigate("/ciisUser/chat", {
        state: {
          selectedUserId: uid,
          selectedConversationId: activeConversationId || selectedChat.conversation?._id || selectedChat._id,
        },
      });
    } else {
      navigate("/ciisUser/chat");
    }
  };

  // Format colleague name & online status
  const getChatTitle = (item) => {
    if (!item) return "Chat";
    if (item.isGroup) {
      return item.name || item.groupName || item.title || "Group";
    }
    return item.name || item.email || "Colleague";
  };

  const isUserOnline = (item) => {
    if (!item) return false;
    const uid = getEntityId(item);
    return onlineUserIds.includes(uid) || Boolean(item.isOnline);
  };

  const startWidgetCall = (callType) => {
    const target = getSelectedChatTarget();
    if (!target) return;
    setShowReactions(false);
    setShowAttachmentMenu(false);
    startCall(callType, target);
  };

  // Filtered lists for the "list" view
  const conversationItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // Map existing conversations
    const convMap = new Map();
    conversations.forEach((c) => {
      if (c.isGroup) {
        convMap.set(`group:${getEntityId(c.clientId || c.projectId || c.groupId || c._id)}`, c);
      } else {
        const otherMember = (c.members || []).find((m) => getEntityId(m) !== currentUserId);
        if (otherMember) {
          convMap.set(`user:${getEntityId(otherMember)}`, c);
        }
      }
    });

    // Build unified item list: Active conversations first, then company users
    const items = [];

    // 1. Existing conversations
    conversations.forEach((conv) => {
      let displayName = "";
      let avatar = null;
      let targetUser = null;

      if (conv.isGroup) {
        displayName = `${conv.name || conv.groupName || "Group"}${conv.clientId ? " (Client)" : conv.projectId ? " (Project)" : ""}`;
        avatar = null;
      } else {
        const other = (conv.members || []).find((m) => getEntityId(m) !== currentUserId);
        targetUser = other;
        displayName = other?.name || other?.email || "Colleague";
        avatar = other;
      }

      const lastMsgText = conv.lastMessage?.text || (conv.lastMessage?.file ? "Sent an attachment" : "Start conversation");
      const unread = Number(conv.unreadCount) || 0;
      const time = conv.lastMessage?.createdAt || conv.updatedAt;

      items.push({
        id: conv._id,
        key: `conv-${conv._id}`,
        isGroup: Boolean(conv.isGroup),
        clientId: conv.clientId,
        projectId: conv.projectId,
        name: displayName,
        avatar,
        lastMessage: lastMsgText,
        time,
        unread,
        conversation: conv,
        targetUser,
      });
    });

    // Include every accessible channel, even when absent from recent conversations.
    companyGroups.forEach(group => {
      const groupId = getEntityId(group.clientId || group.projectId || group);
      if (!groupId || convMap.has(`group:${groupId}`)) return;
      const conversation = group.conversation;
      items.push({
        id: groupId, key: `group-${groupId}`, isGroup: true,
        clientId: group.clientId, projectId: group.projectId,
        name: `${group.name || "Group"}${group.clientId ? " (Client)" : group.projectId ? " (Project)" : ""}`,
        avatar: group.profileImage || group.avatar || group.image,
        lastMessage: getMessagePreview(conversation?.lastMessage),
        time: conversation?.lastMessage?.createdAt || conversation?.updatedAt,
        unread: Number(conversation?.unreadCount) || 0,
        conversation, targetUser: null,
      });
    });

    // 2. Add colleagues who don't have an active conversation yet (for easy quick search)
    companyUsers.forEach((u) => {
      const uid = getEntityId(u);
      if (uid && uid !== currentUserId && !convMap.has(`user:${uid}`)) {
        items.push({
          id: uid,
          key: `user-${uid}`,
          isGroup: false,
          name: u.name || u.email || "Colleague",
          avatar: u,
          lastMessage: u.companyRole || "Direct message",
          time: null,
          unread: 0,
          conversation: null,
          targetUser: u,
        });
      }
    });

    // Filter by Tab & Search
    return items.filter((item) => {
      if (activeTab === "unread" && item.unread <= 0) return false;
      if ((activeTab === "projects" || activeTab === "groups") && !(item.projectId || item.conversation?.projectId || (item.isGroup && !item.clientId && !item.conversation?.clientId))) return false;
      if ((activeTab === "clients" || activeTab === "colleagues") && !(item.clientId || item.conversation?.clientId)) return false;

      if (query) {
        const nameMatch = item.name.toLowerCase().includes(query);
        const msgMatch = String(item.lastMessage || "").toLowerCase().includes(query);
        return nameMatch || msgMatch;
      }
      return true;
    });
  }, [conversations, companyUsers, companyGroups, searchQuery, activeTab, currentUserId]);

  const getMessageSenderName = (msg) => {
    if (!msg) return "Member";
    if (msg.sender && typeof msg.sender === "object") {
      const name = msg.sender.name || msg.sender.fullName || msg.sender.username || msg.sender.email;
      if (name) return name;
    }
    if (msg.senderName) return msg.senderName;
    const senderId = getEntityId(msg.sender || msg.senderId);
    if (senderId) {
      if (Array.isArray(selectedChat?.members)) {
        const member = selectedChat.members.find(
          (m) => getEntityId(m?.user || m) === senderId
        );
        const userObj = member?.user && typeof member.user === "object" ? member.user : member;
        const memberName = userObj?.name || userObj?.fullName || userObj?.username;
        if (memberName) return memberName;
      }
      if (Array.isArray(companyUsers)) {
        const found = companyUsers.find((u) => getEntityId(u) === senderId);
        const foundName = found?.name || found?.fullName || found?.username;
        if (foundName) return foundName;
      }
    }
    return "Member";
  };

  if (isClientUser || !hasCompanyChatAccess()) {
    return null;
  }

  if (!isWidgetOpen) {
    return (
      <button
        type="button"
        className="portal-messenger-launcher"
        onClick={handleOpenWidget}
        aria-label="Open chats and messenger"
        title="Chats & Messenger"
      >
        <span className="portal-messenger-launcher-icon">
          <MessageCircle size={24} />
        </span>
        {totalUnread > 0 && (
          <span className="portal-messenger-launcher-badge">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>
    );
  }

  return (
    <>
      <div
        ref={dropdownRef}
        className="fb-messenger-dropdown"
        aria-label="Messenger Chats Popup"
      >
        {activeView === "list" ? (
          <>
            {/* Header */}
            <div className="fb-messenger-header">
              <h2 className="fb-messenger-title">Chats</h2>
              <div className="fb-messenger-header-actions">
                <button
                  type="button"
                  className="fb-messenger-icon-btn"
                  title="More options"
                  onClick={() => setShowMoreMenu((prev) => !prev)}
                >
                  <MoreHorizontal size={19} />
                </button>

                <button
                  type="button"
                  className="fb-messenger-icon-btn"
                  title="See all in Messenger"
                  onClick={handleOpenFullPage}
                >
                  <Maximize2 size={17} />
                </button>

                <button
                  type="button"
                  className="fb-messenger-icon-btn"
                  title="New message / Search"
                  onClick={() => {
                    setActiveTab("all");
                    inputRef.current?.focus();
                  }}
                >
                  <SquarePen size={17} />
                </button>

                <button
                  type="button"
                  className="fb-messenger-icon-btn"
                  title="Close"
                  onClick={handleCloseWidget}
                >
                  <X size={18} />
                </button>

                {showMoreMenu && (
                  <div className="fb-messenger-more-menu">
                    <button
                      type="button"
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleOpenFullPage();
                      }}
                    >
                      <MessageSquare size={15} /> Open full chat page
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowMoreMenu(false);
                        loadChatData();
                      }}
                    >
                      <Sparkles size={15} /> Refresh chats
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Search Box */}
            <div className="fb-messenger-search-wrap">
              <div className="fb-messenger-search-box">
                <Search size={16} className="fb-messenger-search-icon" />
                <input
                  type="text"
                  placeholder="Search Messenger"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="fb-messenger-search-clear"
                    onClick={() => setSearchQuery("")}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="fb-messenger-tabs">
              <button
                type="button"
                className={`fb-messenger-tab ${activeTab === "all" ? "active" : ""}`}
                onClick={() => setActiveTab("all")}
              >
                All
              </button>
              <button
                type="button"
                className={`fb-messenger-tab ${activeTab === "unread" ? "active" : ""}`}
                onClick={() => setActiveTab("unread")}
              >
                Unread
                {conversations.filter((c) => Number(c.unreadCount) > 0).length > 0 && (
                  <span className="fb-messenger-tab-count">
                    {conversations.filter((c) => Number(c.unreadCount) > 0).length}
                  </span>
                )}
              </button>
              <button
                type="button"
                className={`fb-messenger-tab ${activeTab === "projects" || activeTab === "groups" ? "active" : ""}`}
                onClick={() => setActiveTab("projects")}
              >
                Projects
              </button>
              <button
                type="button"
                className={`fb-messenger-tab ${activeTab === "clients" || activeTab === "colleagues" ? "active" : ""}`}
                onClick={() => setActiveTab("clients")}
              >
                Clients
              </button>
            </div>

            {/* Conversations List */}
            {chatLoadError && (
              <div role="alert" style={{ padding: "10px 16px", color: "#b42318" }}>
                {chatLoadError} <button type="button" onClick={loadChatData}>Retry</button>
              </div>
            )}
            <div className="fb-messenger-list">
              {loadingConversations && conversationItems.length === 0 ? (
                <div className="fb-messenger-skeleton-list">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <div key={idx} className="fb-messenger-skeleton-item">
                      <div className="fb-messenger-skeleton-avatar" />
                      <div className="fb-messenger-skeleton-content">
                        <div className="fb-messenger-skeleton-title" />
                        <div className="fb-messenger-skeleton-subtitle" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversationItems.length > 0 ? (
                conversationItems.map((item) => {
                  const avatarUrl = resolveAvatarUrl(item.avatar);
                  const online = !item.isGroup && isUserOnline(item.targetUser || item.avatar);

                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`fb-messenger-item ${item.unread > 0 ? "unread" : ""}`}
                      onClick={() => handleSelectChat(item)}
                    >
                      <div className="fb-messenger-avatar-wrap">
                        <div className={`fb-messenger-avatar ${item.isGroup ? "group" : ""}`}>
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt=""
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : item.isGroup ? (
                            <Users size={20} />
                          ) : (
                            <span>{item.name?.charAt(0).toUpperCase() || "U"}</span>
                          )}
                        </div>
                        {online && <span className="fb-messenger-online-badge" />}
                      </div>

                      <div className="fb-messenger-info">
                        <strong className="fb-messenger-name">{item.name}</strong>
                        <div className="fb-messenger-preview">
                          <span className="fb-messenger-snippet">{item.lastMessage}</span>
                          {item.time && (
                            <span className="fb-messenger-time">
                              · {formatRelativeTime(item.time)}
                            </span>
                          )}
                        </div>
                      </div>

                      {item.unread > 0 && <span className="fb-messenger-unread-dot" />}
                    </button>
                  );
                })
              ) : (
                <div className="fb-messenger-empty">
                  <div className="fb-messenger-empty-icon">
                    <MessageSquare size={24} />
                  </div>
                  <strong>
                    {activeTab === "unread"
                      ? "No unread messages"
                      : activeTab === "projects" || activeTab === "groups"
                      ? "No project chats found"
                      : activeTab === "clients" || activeTab === "colleagues"
                      ? "No client chats found"
                      : searchQuery
                      ? "No matching conversations"
                      : "No messages found"}
                  </strong>
                  <p>
                    {searchQuery
                      ? "Try searching with another name or email."
                      : "Search for a colleague or start a new conversation."}
                  </p>
                </div>
              )}
            </div>

            {/* Footer: See all in Messenger */}
            <div className="fb-messenger-footer">
              <button
                type="button"
                className="fb-messenger-see-all"
                onClick={handleOpenFullPage}
              >
                See all in Messenger
              </button>
            </div>
          </>
        ) : (
          /* ==========================================================================
             IN-PLACE CHAT CONVERSATION VIEW
             ========================================================================== */
          <div className="fb-chat-view">
            {/* Header */}
            <div className="fb-chat-header">
              <div className="fb-chat-header-left">
                <button
                  type="button"
                  className="fb-chat-back-btn"
                  title="Back to chats"
                  onClick={handleBackToList}
                >
                  <ChevronLeft size={22} />
                </button>

                <div className="fb-chat-header-avatar">
                  <div className={`fb-messenger-avatar ${selectedChat?.isGroup ? "group" : ""}`}>
                    {resolveAvatarUrl(selectedChat) ? (
                      <img src={resolveAvatarUrl(selectedChat)} alt="" />
                    ) : selectedChat?.isGroup ? (
                      <Users size={16} />
                    ) : (
                      <span>{getChatTitle(selectedChat).charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  {!selectedChat?.isGroup && isUserOnline(getSelectedChatTarget()) && (
                    <span className="fb-messenger-online-badge" />
                  )}
                </div>

                <div className="fb-chat-header-info">
                  <span className="fb-chat-header-name">{getChatTitle(selectedChat)}</span>
                  <span
                    className={`fb-chat-header-status ${
                      isUserOnline(getSelectedChatTarget()) ? "online" : "offline"
                    }`}
                  >
                    {selectedChat?.isGroup
                      ? "Group Conversation"
                      : isUserOnline(getSelectedChatTarget())
                      ? "Active now"
                      : "Offline"}
                  </span>
                </div>
              </div>

              <div className="fb-chat-header-actions">
                <button
                  type="button"
                  className="fb-messenger-icon-btn"
                  title="Audio call"
                  onClick={() => startWidgetCall("audio")}
                >
                  <Phone size={16} />
                </button>
                <button
                  type="button"
                  className="fb-messenger-icon-btn"
                  title="Video call"
                  onClick={() => startWidgetCall("video")}
                >
                  <Video size={16} />
                </button>
                <button
                  type="button"
                  className="fb-messenger-icon-btn"
                  title="Open full page"
                  onClick={handleOpenFullPage}
                >
                  <Maximize2 size={16} />
                </button>
                <button
                  type="button"
                  className="fb-messenger-icon-btn"
                  title="Close"
                  onClick={handleCloseWidget}
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* Messages Body */}
            <div
              className={`fb-chat-body ${isDragOver ? "drag-over" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setIsDragOver(false);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragOver(false);
                const [file] = Array.from(event.dataTransfer.files || []);
                if (file) validateAndPreviewFile(file);
              }}
            >
              {isDragOver && <div className="fb-chat-drop-hint">Drop file to preview</div>}
              {loadingMessages ? (
                <div className="fb-chat-empty-thread">
                  <span>Loading messages...</span>
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg, index) => {
                  const isMe =
                    getEntityId(msg.sender) === currentUserId ||
                    (typeof msg.sender === "string" && msg.sender === currentUserId);
                  const messageId = msg._id || msg.id || index;
                  const rawFileUrl = msg.file || msg.fileUrl || msg.attachmentUrl || msg.url || "";
                  // Task updates attach relative /uploads/... paths; resolve them against the backend.
                  const fileUrl = rawFileUrl ? (attachmentUrls(rawFileUrl, API_URL_IMG)[0] || rawFileUrl) : "";
                  const fileType = String(msg.fileType || "").toLowerCase();
                  const fileName = msg.fileName || msg.originalName || "Attachment";
                  const fileKind = fileUrl
                    ? fileType.startsWith("image/")
                      ? "image"
                      : fileType.startsWith("video/")
                      ? "video"
                      : fileType.startsWith("audio/")
                      ? "audio"
                      : "document"
                    : "";
                  const isDeleted = Boolean(msg.deletedForEveryone);
                  const seenBy = Array.isArray(msg.seenBy) ? msg.seenBy : [];
                  const isSeen = isMe && seenBy.some((entry) => getEntityId(entry) !== currentUserId);
                  const showDelivered = isMe && !isSeen && !selectedChat?.isGroup && isUserOnline(getSelectedChatTarget());

                  if (isCallMessage(msg)) {
                    const callInfo = describeCallMessage(msg, currentUserId);
                    return (
                      <div key={messageId} id={`widget-message-${messageId}`} className={`fb-chat-call-log ${callInfo.missed ? "missed" : ""}`}>
                        {callInfo.isVideo ? <Video size={13} /> : <Phone size={13} />}
                        <span>{callInfo.outgoing ? "↗ " : "↙ "}{callInfo.text}</span>
                        {msg.createdAt && <time>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={messageId}
                      id={`widget-message-${messageId}`}
                      className={`fb-chat-message-row ${isMe ? "me" : "peer"}`}
                    >
                      <div className="fb-chat-bubble-wrap">
                        <div className={`fb-chat-bubble ${isDeleted ? "deleted" : ""}`}>
                          {isDeleted ? (
                            <em>This message was deleted</em>
                          ) : (
                            <>
                              {selectedChat?.isGroup && !isMe && (
                                <span className="fb-chat-sender-name">
                                  {getMessageSenderName(msg)}
                                </span>
                              )}
                              {msg.replyTo && <button type="button" className="fb-chat-quoted-reply" onClick={() => document.getElementById(`widget-message-${msg.replyTo._id}`)?.scrollIntoView({ block: "center", behavior: "smooth" })}>
                                <strong>{msg.replyTo.sender?.name || "User"}</strong>
                                <span>{msg.replyTo.deletedForEveryone ? "This message was deleted" : msg.replyTo.text || (attachmentSource(msg.replyTo) ? attachmentLabel(msg.replyTo) : "Message")}</span>
                              </button>}
                              {msg.systemEvent?.client && <button type="button" className="fb-chat-quoted-reply" onClick={async () => {
                                try { const result = await getClientChatTask(msg.systemEvent.client, msg.systemEvent.task); setClientTask(result.data.task); }
                                catch { setAttachmentError("Task is unavailable or access was removed."); }
                              }}>Open task details</button>}
                              {msg.text && <span>{mentionSegments(msg.text, msg.mentions).map((part, index) => part.user
                                ? <strong key={index} className="fb-chat-member-mention">{part.text}</strong>
                                : <React.Fragment key={index}>{part.text}</React.Fragment>)}</span>}
                              {fileKind === "image" && (
                                <img className="fb-chat-message-image" src={fileUrl} alt={fileName} />
                              )}
                              {fileKind === "video" && (
                                <video className="fb-chat-message-video" src={fileUrl} controls />
                              )}
                              {fileKind === "audio" && (
                                <audio className="fb-chat-message-audio" src={fileUrl} controls />
                              )}
                              {fileKind === "document" && (
                                <a
                                  className="fb-chat-message-file"
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <FileText size={16} />
                                  <span>{fileName}</span>
                                </a>
                              )}
                              {!msg.text && !fileKind && getMessagePreview(msg)}
                            </>
                          )}
                        </div>
                        {!isDeleted && (
                          <button
                            type="button"
                            className="fb-chat-message-menu-btn"
                            title="Message options"
                            onClick={() => setOpenMessageMenuId((prev) => (
                              prev === messageId ? "" : messageId
                            ))}
                          >
                            <MoreVertical size={14} />
                          </button>
                        )}
                        {openMessageMenuId === messageId && !isDeleted && (
                          <div className="fb-chat-message-menu">
                            <button type="button" onClick={() => {
                              setReplyingTo(msg); setOpenMessageMenuId("");
                              requestAnimationFrame(() => inputRef.current?.focus());
                            }}><Reply size={14} /> Reply</button>
                            <button type="button" onClick={() => handleDeleteForMe(msg)}>
                              <Trash2 size={14} /> Delete
                            </button>
                            {isMe && !(msg.messageType === "system" && msg.systemEvent?.task) && (
                              <button
                                type="button"
                                className="danger"
                                onClick={() => setConfirmDeleteMessage(msg)}
                              >
                                <Trash2 size={14} /> Delete for everyone
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <span className={`fb-chat-time ${isSeen ? "seen" : ""}`}>
                        {formatMessageTime(msg.createdAt)}
                        {isMe && (
                          <span
                            className={`fb-chat-seen-mark ${
                              isSeen ? "seen" : showDelivered ? "delivered" : "sent"
                            }`}
                            title={isSeen ? "Seen" : showDelivered ? "Delivered" : "Sent"}
                          >
                            {isSeen || showDelivered ? (
                              <CheckCheck size={13} strokeWidth={3} />
                            ) : (
                              <Check size={13} strokeWidth={3} />
                            )}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="fb-chat-empty-thread">
                  <div className="fb-messenger-empty-icon">
                    <MessageSquare size={22} />
                  </div>
                  <strong>Say hello to {getChatTitle(selectedChat)}! 👋</strong>
                  <p>Send a message below to start chatting right here.</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {clientTask && <TaskDetailsModal open task={clientTask} canEdit={false} employeeInfo={currentUser}
              onClose={() => setClientTask(null)} mentionUsers={mentionCandidates}
              onRemarkAdded={async (task, text, _files, mentions) => {
                const key = JSON.stringify([task.clientId, task._id, text, mentions]);
                const requestId = clientRemarkRequests.current.get(key) || crypto.randomUUID();
                clientRemarkRequests.current.set(key, requestId);
                await addClientChatRemark(task.clientId, task._id, text, mentions, requestId);
                const result = await getClientChatTask(task.clientId, task._id); setClientTask(result.data.task);
                clientRemarkRequests.current.delete(key);
              }} />}
            {/* Input Bar */}
            <div className="fb-chat-input-area">
              {showAttachmentMenu && (
                <div className="fb-chat-attachment-menu">
                  <button type="button" onClick={() => documentInputRef.current?.click()}>
                    <FileText size={18} /> Document
                  </button>
                  <button type="button" onClick={() => mediaInputRef.current?.click()}>
                    <Images size={18} /> Photos & videos
                  </button>
                  <button type="button" onClick={() => cameraInputRef.current?.click()}>
                    <Camera size={18} /> Camera
                  </button>
                  <button type="button" onClick={() => audioInputRef.current?.click()}>
                    <Mic size={18} /> Audio
                  </button>
                </div>
              )}
              {showReactions && (
                <div className="fb-chat-emoji-menu">
                  <EmojiPicker
                    colorScheme={Theme.LIGHT}
                    emojiStyle={EmojiStyle.NATIVE}
                    categories={CHAT_EMOJI_CATEGORIES}
                    skinTonePickerLocation={SkinTonePickerLocation.SEARCH}
                    searchPlaceHolder="Search emoji"
                    lazyLoadEmojis
                    width="100%"
                    height={330}
                    previewConfig={{ showPreview: false }}
                    onEmojiClick={handleReactionClick}
                  />
                </div>
              )}

              {replyingTo && <div className="fb-chat-reply-preview">
                <div><strong>Replying to {replyingTo.sender?.name || "User"}</strong><span>{replyingTo.text || "Attachment"}</span></div>
                <button type="button" aria-label="Cancel reply" onClick={() => setReplyingTo(null)}><X size={16} /></button>
              </div>}
              <div className="fb-chat-inputbar">
                <button
                  type="button"
                  className="fb-chat-attachment-btn"
                  title="Attach"
                  onClick={() => {
                    setShowAttachmentMenu((prev) => !prev);
                    setShowReactions(false);
                  }}
                  disabled={isSending}
                >
                  <Paperclip size={18} />
                </button>
                <button
                  type="button"
                  className="fb-messenger-search-clear"
                  title="Quick reactions"
                  onClick={() => setShowReactions((prev) => !prev)}
                >
                  <Smile size={18} color="#65676b" />
                </button>

                <ChatMentionInput
                  key={activeConversationId || "new-chat"}
                  mentions={messageMentions}
                  members={mentionCandidates}
                  onMentionSelect={setInputText}
                  aria-label={replyingTo ? "Write a reply" : "Write a message"}
                  ref={inputRef}
                  type="text"
                  className="fb-chat-input chat-input"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isSending}
                />

                <button
                  type="button"
                  className="fb-chat-send-btn"
                  title="Send message"
                  disabled={!inputText.trim() || isSending}
                  onClick={() => handleSendMessage()}
                >
                  <Send size={15} />
                </button>
              </div>
              <input
                ref={documentInputRef}
                type="file"
                className="fb-chat-file-input"
                onChange={handleFileInputChange}
              />
              <input
                ref={mediaInputRef}
                type="file"
                className="fb-chat-file-input"
                accept="image/*,video/*"
                onChange={handleFileInputChange}
              />
              <input
                ref={cameraInputRef}
                type="file"
                className="fb-chat-file-input"
                accept="image/*"
                capture="environment"
                onChange={handleFileInputChange}
              />
              <input
                ref={audioInputRef}
                type="file"
                className="fb-chat-file-input"
                accept="audio/*"
                onChange={handleFileInputChange}
              />
            </div>

            {attachmentError && (
              <div className="fb-chat-attachment-error">{attachmentError}</div>
            )}

            {pendingAttachment && (
              <div className="fb-chat-preview-overlay" role="dialog" aria-modal="true">
                <div className="fb-chat-preview-modal">
                  <div className="fb-chat-preview-header">
                    <strong>Preview attachment</strong>
                    <button
                      type="button"
                      className="fb-chat-preview-close"
                      title="Close preview"
                      onClick={() => setPendingAttachment(null)}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="fb-chat-preview-body">
                    {pendingAttachment.kind === "image" && (
                      <img src={attachmentPreviewUrl} alt={pendingAttachment.file.name} />
                    )}
                    {pendingAttachment.kind === "video" && (
                      <video src={attachmentPreviewUrl} controls />
                    )}
                    {pendingAttachment.kind === "audio" && (
                      <audio src={attachmentPreviewUrl} controls />
                    )}
                    {pendingAttachment.kind === "document" && (
                      <div className="fb-chat-document-preview">
                        <FileText size={28} />
                        <span>{pendingAttachment.file.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="fb-chat-preview-footer">
                    <div className="fb-chat-preview-meta">
                      <span title={pendingAttachment.file.name}>{pendingAttachment.file.name}</span>
                      <span>{formatFileSize(pendingAttachment.file.size)}</span>
                    </div>
                    <div className="fb-chat-preview-actions">
                      <button type="button" onClick={() => setPendingAttachment(null)}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="primary"
                        onClick={handleSendFile}
                        disabled={isSending}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {confirmDeleteMessage && (
              <div className="fb-chat-preview-overlay" role="dialog" aria-modal="true">
                <div className="fb-chat-confirm-modal">
                  <div className="fb-chat-preview-header">
                    <strong>Delete for everyone?</strong>
                    <button
                      type="button"
                      className="fb-chat-preview-close"
                      title="Cancel"
                      onClick={() => setConfirmDeleteMessage(null)}
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <p>This message will be removed from this conversation for all members.</p>
                  <div className="fb-chat-preview-actions">
                    <button type="button" onClick={() => setConfirmDeleteMessage(null)}>
                      No
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={confirmDeleteForEveryone}
                      disabled={isSending}
                    >
                      Yes, delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default MessengerDropdown;
