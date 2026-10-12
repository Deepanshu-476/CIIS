import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  ChevronDown,
  MessageCircle,
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
} from "../../services/chatService";
import { resolveAvatarUrl } from "../../chat/messageUtils";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/useAuth";
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

const MessengerDropdown = ({ isOpen, onClose, onUnreadChange }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { socket } = useSocket();

  const currentUserId = (currentUser?._id || currentUser?.id || "").toString();

  // Controlled or internal open state
  const [isOpenInternal, setIsOpenInternal] = useState(false);
  const isWidgetOpen = isOpen !== undefined ? isOpen : isOpenInternal;

  // Navigation / View State: "list" | "chat"
  const [activeView, setActiveView] = useState("list");
  const [selectedChat, setSelectedChat] = useState(null); // Active conversation or user
  const [activeConversationId, setActiveConversationId] = useState(null);

  // Data States
  const [conversations, setConversations] = useState([]);
  const [companyUsers, setCompanyUsers] = useState([]);
  const [companyGroups, setCompanyGroups] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "unread" | "groups" | "colleagues"
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  // Input & Sending
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

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

  // Fetch initial conversations, users, and groups
  const loadChatData = async () => {
    try {
      const [convRes, usersRes, groupsRes] = await Promise.all([
        getConversations().catch(() => ({ data: {} })),
        getCompanyUsers().catch(() => ({ data: {} })),
        getCompanyGroups().catch(() => ({ data: {} })),
      ]);

      const convList = convRes.data?.conversations || [];
      const usersList = usersRes.data?.users || [];
      const groupsList = groupsRes.data?.groups || groupsRes.data?.data || [];

      setConversations(convList);
      setCompanyUsers(usersList);
      setCompanyGroups(groupsList);

      // Compute total unread
      const unreadTotal = convList.reduce((sum, c) => sum + (Number(c.unreadCount) || 0), 0);
      onUnreadChange?.(unreadTotal);
    } catch (err) {
      console.warn("Failed to load chat conversations:", err);
    }
  };

  useEffect(() => {
    loadChatData();
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

    const handleReceiveMessage = (msg) => {
      const msgConvId = (msg?.conversationId || msg?.conversation?._id || "").toString();

      // If viewing this conversation currently
      if (activeConversationId && msgConvId === activeConversationId) {
        setMessages((prev) => {
          if (prev.some((m) => (m._id || m.id) === (msg._id || msg.id))) return prev;
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

      // Refresh conversations list to update last message & unread badge
      loadChatData();
    };

    const handleUnreadUpdate = () => {
      loadChatData();
    };

    socket.on("chat:online-users", handleOnline);
    socket.on("chat:user-online", handleUserOnline);
    socket.on("chat:user-offline", handleUserOffline);
    socket.on("chat:receive-message", handleReceiveMessage);
    socket.on("chat:unread-update", handleUnreadUpdate);

    if (socket.connected) {
      socket.emit("chat:get-online-users", handleOnline);
    }

    return () => {
      socket.off("chat:online-users", handleOnline);
      socket.off("chat:user-online", handleUserOnline);
      socket.off("chat:user-offline", handleUserOffline);
      socket.off("chat:receive-message", handleReceiveMessage);
      socket.off("chat:unread-update", handleUnreadUpdate);
    };
  }, [socket, activeConversationId, currentUserId]);

  // Handle opening a chat (conversation or colleague)
  const handleSelectChat = async (target) => {
    setSelectedChat(target);
    setActiveView("chat");
    setLoadingMessages(true);
    setInputText("");

    try {
      let convId = target?.conversation?._id || (target?.members ? target?._id : null);

      // If selecting a user without an existing conversation, create/find it
      if (!convId && !target.isGroup) {
        const targetId = getEntityId(target);
        const res = await createConversation(targetId);
        convId = res.data?.conversation?._id || res.data?._id;
      } else if (!convId && target.isGroup) {
        const groupId = getEntityId(target);
        const res = await createGroupConversation(groupId);
        convId = res.data?.conversation?._id || res.data?._id;
      }

      if (convId) {
        setActiveConversationId(convId);
        socket?.emit("chat:join-conversation", { conversationId: convId });

        const msgRes = await getMessages(convId);
        const fetchedMessages = msgRes.data?.messages || [];
        setMessages(fetchedMessages);

        // Mark unread messages as seen
        fetchedMessages.forEach((m) => {
          if (m._id && getEntityId(m.sender) !== currentUserId && !m.seen) {
            markMessageSeen(m._id).catch(() => {});
          }
        });
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
    loadChatData();
  };

  // Handle sending a message
  const handleSendMessage = async (textToSend = inputText) => {
    const text = String(textToSend || "").trim();
    if (!text || !activeConversationId || isSending) return;

    setIsSending(true);
    setInputText("");

    try {
      const formData = new FormData();
      formData.append("conversationId", activeConversationId);
      formData.append("text", text);

      const res = await sendMessage(formData);
      const sentMsg = res.data?.message || res.data;

      // Add to local state immediately
      setMessages((prev) => [...prev, sentMsg]);

      // Emit on socket for peer
      if (socket) {
        const receiverId = selectedChat?.isGroup
          ? undefined
          : getEntityId(selectedChat);

        socket.emit("chat:send-message", {
          conversationId: activeConversationId,
          receiverId,
          ...sentMsg,
        });
      }

      setTimeout(() => scrollToBottom(true), 50);
      loadChatData();
    } catch (err) {
      console.warn("Failed to send message:", err);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // Quick reaction emoji click
  const handleReactionClick = (emoji) => {
    handleSendMessage(emoji);
    setShowReactions(false);
  };

  // Navigate to full chat page
  const handleOpenFullPage = () => {
    onClose();
    if (selectedChat) {
      const uid = getEntityId(selectedChat);
      navigate("/ciisUser/chat", { state: { selectedUserId: uid } });
    } else {
      navigate("/ciisUser/chat");
    }
  };

  // Format colleague name & online status
  const getChatTitle = (item) => {
    if (!item) return "Chat";
    if (item.isGroup) {
      return item.name || item.groupName || item.title || "Group Channel";
    }
    return item.name || item.email || "Colleague";
  };

  const isUserOnline = (item) => {
    if (!item) return false;
    const uid = getEntityId(item);
    return onlineUserIds.includes(uid) || Boolean(item.isOnline);
  };

  // Filtered lists for the "list" view
  const conversationItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    // Map existing conversations
    const convMap = new Map();
    conversations.forEach((c) => {
      if (c.isGroup) {
        convMap.set(`group:${getEntityId(c.groupId || c._id)}`, c);
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
        displayName = conv.name || conv.groupName || "Group Channel";
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
        name: displayName,
        avatar,
        lastMessage: lastMsgText,
        time,
        unread,
        conversation: conv,
        targetUser,
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
      if (activeTab === "groups" && !item.isGroup) return false;
      if (activeTab === "colleagues" && item.isGroup) return false;

      if (query) {
        const nameMatch = item.name.toLowerCase().includes(query);
        const msgMatch = String(item.lastMessage || "").toLowerCase().includes(query);
        return nameMatch || msgMatch;
      }
      return true;
    });
  }, [conversations, companyUsers, searchQuery, activeTab, currentUserId]);

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
                  title="New message / Search colleagues"
                  onClick={() => {
                    setActiveTab("colleagues");
                    inputRef.current?.focus();
                  }}
                >
                  <SquarePen size={17} />
                </button>

                <button
                  type="button"
                  className="fb-messenger-icon-btn"
                  title="Minimize"
                  onClick={handleCloseWidget}
                >
                  <ChevronDown size={19} />
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
                className={`fb-messenger-tab ${activeTab === "groups" ? "active" : ""}`}
                onClick={() => setActiveTab("groups")}
              >
                Groups
              </button>
              <button
                type="button"
                className={`fb-messenger-tab ${activeTab === "colleagues" ? "active" : ""}`}
                onClick={() => setActiveTab("colleagues")}
              >
                Colleagues
              </button>
            </div>

            {/* Conversations List */}
            <div className="fb-messenger-list">
              {conversationItems.length > 0 ? (
                conversationItems.map((item) => {
                  const avatarUrl = resolveAvatarUrl(item.avatar);
                  const online = !item.isGroup && isUserOnline(item.targetUser || item.avatar);

                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`fb-messenger-item ${item.unread > 0 ? "unread" : ""}`}
                      onClick={() => handleSelectChat(item.targetUser || item.conversation || item)}
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
                  <strong>No messages found</strong>
                  <p>Search for a colleague or start a new conversation.</p>
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
             IN-PLACE CHAT CONVERSATION VIEW ("jisse main chat bhi yhi se krr sku")
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
                  {!selectedChat?.isGroup && isUserOnline(selectedChat) && (
                    <span className="fb-messenger-online-badge" />
                  )}
                </div>

                <div className="fb-chat-header-info">
                  <span className="fb-chat-header-name">{getChatTitle(selectedChat)}</span>
                  <span
                    className={`fb-chat-header-status ${
                      isUserOnline(selectedChat) ? "online" : "offline"
                    }`}
                  >
                    {selectedChat?.isGroup
                      ? "Group Conversation"
                      : isUserOnline(selectedChat)
                      ? "Active now"
                      : "Offline"}
                  </span>
                </div>
              </div>

              <div className="fb-chat-header-actions">
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
                  title="Minimize"
                  onClick={handleCloseWidget}
                >
                  <ChevronDown size={18} />
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
            <div className="fb-chat-body">
              {loadingMessages ? (
                <div className="fb-chat-empty-thread">
                  <span>Loading messages...</span>
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg, index) => {
                  const isMe =
                    getEntityId(msg.sender) === currentUserId ||
                    (typeof msg.sender === "string" && msg.sender === currentUserId);

                  return (
                    <div
                      key={msg._id || index}
                      className={`fb-chat-message-row ${isMe ? "me" : "peer"}`}
                    >
                      <div className="fb-chat-bubble">{msg.text}</div>
                      <span className="fb-chat-time">
                        {formatMessageTime(msg.createdAt)}
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

            {/* Input Bar */}
            <div className="fb-chat-input-area">
              {showReactions && (
                <div className="fb-chat-quick-reactions">
                  {["👍", "❤️", "😂", "🔥", "🎉", "👏", "💯", "🙏"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="fb-chat-reaction-btn"
                      onClick={() => handleReactionClick(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <div className="fb-chat-inputbar">
                <button
                  type="button"
                  className="fb-messenger-search-clear"
                  title="Quick reactions"
                  onClick={() => setShowReactions((prev) => !prev)}
                >
                  <Smile size={18} color="#65676b" />
                </button>

                <input
                  ref={inputRef}
                  type="text"
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
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MessengerDropdown;
