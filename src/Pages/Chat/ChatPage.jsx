import React, { useEffect, useState } from "react";
import "./chat.css";
import ChatSidebar from "../../chat/ChatSidebar";
import ChatBox from "../../chat/ChatBox";
import {
  changeMyPassword,
  createCompanyGroup,
  createGroupConversation,
  getCompanyGroups,
  getCompanyUsers,
  getConversations,
  getMyProfile,
  getNotificationPreferences,
  updateMyProfile,
  updateNotificationPreferences,
} from "../../services/chatService";
import { useSocket } from "../../context/SocketContext";
import { useCall } from "../../context/CallContext";
import {
  MessageCircle,
  MoreVertical,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  PhoneOutgoing,
  Plus,
  Search,
  Settings,
  Shield,
  TimerReset,
  Users,
  Video,
  Bell,
  Keyboard,
  Lock,
  Monitor,
  UserCircle,
  KeyRound,
} from "lucide-react";

const getEntityId = value => {
  if (!value) return "";
  if (typeof value === "object") {
    return (value._id || value.id || value.userId || value.user?._id || value.user?.id || "").toString();
  }
  return value.toString();
};

const normalizeOnlineUserIds = value => {
  const source = Array.isArray(value)
    ? value
    : Array.isArray(value?.users)
      ? value.users
      : Array.isArray(value?.onlineUsers)
        ? value.onlineUsers
        : Array.isArray(value?.data)
          ? value.data
          : [];

  return source.map(getEntityId).filter(Boolean);
};

const isTruthyOnline = value => (
  value === true ||
  value === 1 ||
  String(value || "").toLowerCase() === "true" ||
  String(value || "").toLowerCase() === "online"
);

const getDisplayName = item => (
  item?.isGroup
    ? item.name || item.groupName || item.group_name || item.title || "Group"
    : item?.name || item?.email || item?.phone || "User"
);

const getItemId = item => (
  item?._id || item?.id || item?.userId || item?.user?._id || item?.user?.id || ""
).toString();

const getCallTime = value => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getCallLabel = call => {
  const direction = call.direction === "incoming" ? "Incoming" : "Outgoing";
  const type = call.type === "video" ? "video" : "voice";
  if (call.status === "missed") return `Missed ${type} call`;
  if (call.status === "declined") return `Declined ${type} call`;
  if (call.status === "failed") return `Failed ${type} call`;
  return `${direction} ${type} call`;
};

const ChatStatusPanel = ({
  users,
  groups,
  statuses,
  addStatus,
  deleteStatus,
  setSelectedUser,
  onOpenChats,
  title = "Status",
  subtitle = "Recent updates",
}) => {
  const [statusText, setStatusText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showStatusOptions, setShowStatusOptions] = useState(false);
  const statusFileInputRef = React.useRef(null);

  const handleImage = event => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const image = String(reader.result || "");
      const text = statusText.trim();
      addStatus({ text, image });
      setSelectedStatus({
        id: `my-status-${Date.now()}`,
        sourceStatusId: "",
        title: "My status",
        time: "Just now",
        image,
        text: text || "Image status",
        viewed: false,
        isOwn: true,
      });
      setStatusText("");
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const statusTime = value => {
    if (!value) return "Today";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Today";
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (date.toDateString() === today.toDateString()) return `Today at ${time}`;
    if (date.toDateString() === yesterday.toDateString()) return `Yesterday at ${time}`;
    return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  const ownStatus = statuses[0] || null;
  const ownStatusPreview = ownStatus ? {
    id: `my-status-${ownStatus.id || ownStatus.createdAt || "latest"}`,
    sourceStatusId: ownStatus.id,
    title: "My status",
    time: statusTime(ownStatus.createdAt),
    image: ownStatus.image || "",
    text: ownStatus.text || "Image status",
    viewed: false,
    isOwn: true,
  } : null;
  const getUserStatusPayload = item => {
    const statusSource = item?.latestStatus || item?.statusUpdate || item?.story || item?.status;
    if (statusSource && typeof statusSource === "object") return statusSource;
    if (Array.isArray(item?.statuses) && item.statuses.length) return item.statuses[0];
    if (Array.isArray(item?.stories) && item.stories.length) return item.stories[0];
    return null;
  };

  const contactStatuses = [...(users || []), ...(groups || [])]
    .map((item, index) => {
      const status = getUserStatusPayload(item);
      if (!status) return null;

      const createdAt = status.createdAt || status.updatedAt || status.time || item.statusAt || item.updatedAt;
      return {
        id: `contact-status-${getItemId(item) || index}-${status.id || status._id || createdAt || index}`,
        title: getDisplayName(item),
        time: statusTime(createdAt),
        image: status.image || status.mediaUrl || status.fileUrl || status.url || item.avatar || item.profileImage || item.image || "",
        text: status.text || status.caption || "Status update",
        viewed: Boolean(status.viewed || status.isViewed || status.seen),
      };
    })
    .filter(Boolean);
  const recentStatuses = contactStatuses.filter(status => !status.viewed);
  const viewedStatuses = contactStatuses.filter(status => status.viewed);
  const isCommunities = title !== "Status";

  const renderStatusItem = status => (
    <button
      className={selectedStatus?.id === status.id ? "chat-status-card active" : "chat-status-card"}
      type="button"
      key={status.id}
      onClick={() => setSelectedStatus(status)}
    >
      <span className={status.viewed ? "chat-status-avatar viewed" : "chat-status-avatar"}>
        {status.image ? <img src={status.image} alt="" /> : status.title.charAt(0).toUpperCase()}
      </span>
      <span>
        <strong>{status.title}</strong>
        <small>{status.time}</small>
      </span>
    </button>
  );

  return (
    <aside className="chat-sidebar chat-view-panel chat-status-panel">
      <section className="chat-sidebar-card conversations-card">
        <div className="sidebar-top">
          <div>
            <div className="sidebar-title">{title}</div>
            <div className="sidebar-subtitle">{isCommunities ? subtitle : "Share photos, videos and text"}</div>
          </div>
          {!isCommunities && (
            <div className="sidebar-actions">
              <button className="sidebar-icon" type="button" title="Create status" onClick={() => statusFileInputRef.current?.click()}>
                <Plus size={18} />
              </button>
              <button className="sidebar-icon" type="button" title="More">
                <MoreVertical size={18} />
              </button>
            </div>
          )}
          {isCommunities && (
            <button className="sidebar-icon" type="button" title="Create group">
              <Plus size={17} />
            </button>
          )}
        </div>
        <input
          ref={statusFileInputRef}
          className="chat-status-file-input"
          type="file"
          accept="image/*"
          onChange={handleImage}
        />
        <div className="chat-status-list">
          <button className="chat-status-card own-status" type="button" onClick={() => ownStatusPreview ? setSelectedStatus(ownStatusPreview) : statusFileInputRef.current?.click()}>
            <span className="chat-status-avatar">{ownStatus?.image ? <img src={ownStatus.image} alt="" /> : (ownStatus?.text || "U").charAt(0).toUpperCase()}<i>+</i></span>
            <span>
              <strong>My status</strong>
              <small>{ownStatus ? statusTime(ownStatus.createdAt) : "Click to add status update"}</small>
            </span>
          </button>
          {!isCommunities && <div className="chat-status-section-label">Recent</div>}
          {!isCommunities && recentStatuses.map(renderStatusItem)}
          {!isCommunities && recentStatuses.length === 0 && (
            <div className="chat-sidebar-empty">No recent status updates</div>
          )}
          {!isCommunities && viewedStatuses.length > 0 && <div className="chat-status-section-label">Viewed</div>}
          {!isCommunities && viewedStatuses.map(renderStatusItem)}
          {isCommunities && [...(groups || [])].map(item => (
            <button className="chat-status-card" type="button" key={getItemId(item)} onClick={() => { setSelectedUser(item); onOpenChats(); }}>
              <span className="chat-status-avatar viewed">{getDisplayName(item).charAt(0).toUpperCase()}</span>
              <span><strong>{getDisplayName(item)}</strong><small>Group conversation</small></span>
            </button>
          ))}
        </div>
        {!isCommunities && (
          <div className="chat-status-detail">
            <div className="chat-status-empty">
              <TimerReset size={52} />
              <h2>Share statuses</h2>
              <p>Share photos, videos and text that disappear after 24 hours.</p>
            </div>
          </div>
        )}
        {!isCommunities && selectedStatus && (
          <div className="chat-status-viewer">
            <button type="button" className="chat-status-viewer-back" onClick={() => setSelectedStatus(null)} aria-label="Back">←</button>
            <button type="button" className="chat-status-viewer-close" onClick={() => setSelectedStatus(null)} aria-label="Close">×</button>
            <div className="chat-status-viewer-blur">
              {selectedStatus.image && <img src={selectedStatus.image} alt="" />}
            </div>
            <div className="chat-status-story">
              <div className="chat-status-progress"><span /></div>
              <div className="chat-status-story-head">
                <span className="chat-status-avatar">
                  {selectedStatus.image ? <img src={selectedStatus.image} alt="" /> : selectedStatus.title.charAt(0).toUpperCase()}
                </span>
                <span>
                  <strong>{selectedStatus.title}</strong>
                  <small>{selectedStatus.time}</small>
                </span>
                <button type="button" className="chat-status-story-close" onClick={() => setSelectedStatus(null)} aria-label="Close">×</button>
                <span className="chat-status-story-menu">
                  <button type="button" aria-label="More" onClick={() => setShowStatusOptions(prev => !prev)}><MoreVertical size={20} /></button>
                  {showStatusOptions && selectedStatus.isOwn && (
                    <button
                      type="button"
                      className="chat-status-delete-option"
                      onClick={() => {
                        deleteStatus?.(selectedStatus.sourceStatusId);
                        setSelectedStatus(null);
                        setShowStatusOptions(false);
                      }}
                    >
                      Delete status
                    </button>
                  )}
                </span>
              </div>
              <div className={selectedStatus.image ? "chat-status-story-media" : "chat-status-story-media text-only"}>
                {selectedStatus.image ? (
                  <img src={selectedStatus.image} alt={selectedStatus.title} />
                ) : (
                  <p>{selectedStatus.text}</p>
                )}
              </div>
              <div className="chat-status-reply">
                <button type="button" aria-label="Emoji">☺</button>
                <input placeholder="Type a reply..." />
                <button type="button" aria-label="Send">➤</button>
              </div>
            </div>
          </div>
        )}
      </section>
    </aside>
  );
};

const ChatCallsPanel = ({
  calls,
  users,
  groups,
  selectedCallId,
  setSelectedCallId,
  startCall,
  clearCallHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const startContactCall = (callType, target) => {
    startCall(callType, target);
  };

  const sortedCalls = [...(calls || [])].sort((first, second) => (
    new Date(second.startedAt || second.updatedAt || 0).getTime() -
    new Date(first.startedAt || first.updatedAt || 0).getTime()
  ));

  const filteredCalls = sortedCalls.filter(call => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return [
      call.title,
      call.peerUser?.name,
      call.peerUser?.phone,
      call.peerUserId,
      getCallLabel(call),
    ].some(value => String(value || "").toLowerCase().includes(query));
  });

  const favouriteTargets = [...(users || []), ...(groups || [])].slice(0, 3);

  return (
    <aside className="chat-sidebar chat-view-panel chat-calls-panel">
      <section className="chat-sidebar-card conversations-card">
        <div className="sidebar-top">
          <div>
            <div className="sidebar-title">Calls</div>
            <div className="sidebar-subtitle">{calls.length ? `${calls.length} calls in history` : "No recent calls"}</div>
          </div>
          <button className="sidebar-icon" type="button" title="Start call" onClick={() => setSelectedCallId("")}>
            <PhoneCall size={17} />
          </button>
        </div>

        <div className="chat-call-search">
          <Search size={17} />
          <input
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder="Search name or number"
          />
        </div>

        <div className="chat-call-section-title">Favourites</div>
        <div className="chat-call-favourites">
          <button type="button" className="chat-call-favourite-add" onClick={() => setSelectedCallId("")}>
            <span><Plus size={17} /></span>
            <strong>Add favourite</strong>
          </button>
          {favouriteTargets.map(target => (
            <button type="button" className="chat-call-favourite-contact" key={getItemId(target)} onClick={() => startContactCall("audio", target)}>
              <span>{getDisplayName(target).charAt(0).toUpperCase()}</span>
              <strong>{getDisplayName(target)}</strong>
            </button>
          ))}
        </div>

        <div className="chat-call-section-row">
          <span>Recent</span>
          {calls.length > 0 && (
            <button type="button" onClick={clearCallHistory}>Clear</button>
          )}
        </div>

        <div className="chat-call-list">
          {filteredCalls.map(call => {
            const callTime = getCallTime(call.startedAt || call.updatedAt);
            const isMissed = call.status === "missed";
            const directionLabel = isMissed
              ? "Missed"
              : call.direction === "incoming"
                ? "Incoming"
                : "Outgoing";
            const icon = isMissed
              ? <PhoneMissed size={14} />
              : call.direction === "incoming"
                ? <PhoneIncoming size={14} />
                : <PhoneOutgoing size={14} />;

            return (
            <button
              type="button"
              key={call.callId}
              className={selectedCallId === call.callId ? "chat-call-item active" : "chat-call-item"}
              onClick={() => setSelectedCallId(call.callId)}
            >
              <span className="chat-call-avatar">
                {(call.title || call.peerUser?.name || "U").charAt(0).toUpperCase()}
              </span>
              <span className="chat-call-body">
                <strong>{call.title || "User"}</strong>
                <small className={isMissed ? "missed" : ""}>
                  {icon}
                  {directionLabel}{call.repeatCount > 1 ? ` (${call.repeatCount})` : ""}
                </small>
              </span>
              <span className="chat-call-time">{callTime}</span>
              <span className="chat-call-type">{call.type === "video" ? <Video size={15} /> : <Phone size={15} />}</span>
            </button>
            );
          })}
          {filteredCalls.length === 0 && (
            <div className="chat-sidebar-empty">Your call history will appear here.</div>
          )}
        </div>
      </section>
    </aside>
  );
};

const ChatCallsDetail = ({ call, users, groups, startCall }) => {
  const contacts = [...(users || []), ...(groups || [])];
  const target = contacts.find(item => getItemId(item) === call?.peerUserId) || call?.peerUser;

  if (!call) {
    return (
      <section className="chat-empty chat-calls-detail">
        <div className="chat-call-action-grid">
          <button type="button">
            <span><Video size={20} /></span>
            <strong>Start call</strong>
          </button>
          <button type="button">
            <span><KeyRound size={20} /></span>
            <strong>New call link</strong>
          </button>
          <button type="button">
            <span><Phone size={20} /></span>
            <strong>Call a number</strong>
          </button>
          <button type="button">
            <span><TimerReset size={20} /></span>
            <strong>Schedule call</strong>
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="chat-empty chat-calls-detail">
      <div className="chat-call-detail-card">
        <span className={call.status === "missed" ? "chat-call-detail-icon missed" : "chat-call-detail-icon"}>
          {call.type === "video" ? <Video size={28} /> : <Phone size={28} />}
        </span>
        <h2>{call.title || "User"}</h2>
        <p>{getCallLabel(call)}</p>
        <div className="chat-call-detail-grid">
          <span>Time</span><strong>{getCallTime(call.startedAt || call.updatedAt)}</strong>
          <span>Direction</span><strong>{call.direction === "incoming" ? "Incoming" : "Outgoing"}</strong>
          <span>Status</span><strong>{call.status || "ended"}</strong>
          <span>Participants</span><strong>{call.participantCount || 1}</strong>
        </div>
        <div className="chat-call-detail-actions">
          <button type="button" onClick={() => startCall("audio", target || call.peerUser)}><Phone size={17} /> Voice call</button>
          <button type="button" onClick={() => startCall("video", target || call.peerUser)}><Video size={17} /> Video call</button>
        </div>
      </div>
    </section>
  );
};

const defaultChatSettings = {
  about: "Available",
  blockedContacts: [],
  privacy: { lastSeen: "everyone", profilePhoto: "everyone", readReceipts: true, groups: "everyone" },
  chats: { theme: "system", enterToSend: true, mediaAutoDownload: true, wallpaper: "" },
  videoVoice: { cameraEnabled: true, microphoneEnabled: true, speakerEnabled: true },
  general: { startWithSystem: false, keepLoggedIn: true, compactMode: true },
  keyboard: { enabled: true, sendMessage: "Enter", newLine: "Shift+Enter" },
};

const defaultNotificationPrefs = {
  push: true,
  web: true,
  email: false,
  channels: { taskAssigned: true, taskClient: true, leave: true, assets: true, projects: true, chats: true, attendance: true },
  quietHours: { start: "", end: "" },
};

const mergeChatSettings = value => ({
  ...defaultChatSettings,
  ...(value || {}),
  privacy: { ...defaultChatSettings.privacy, ...(value?.privacy || {}) },
  chats: { ...defaultChatSettings.chats, ...(value?.chats || {}) },
  videoVoice: { ...defaultChatSettings.videoVoice, ...(value?.videoVoice || {}) },
  general: { ...defaultChatSettings.general, ...(value?.general || {}) },
  keyboard: { ...defaultChatSettings.keyboard, ...(value?.keyboard || {}) },
  blockedContacts: Array.isArray(value?.blockedContacts) ? value.blockedContacts.map(getEntityId).filter(Boolean) : [],
});

const mergeNotificationPrefs = value => ({
  ...defaultNotificationPrefs,
  ...(value || {}),
  channels: { ...defaultNotificationPrefs.channels, ...(value?.channels || {}) },
  quietHours: { ...defaultNotificationPrefs.quietHours, ...(value?.quietHours || {}) },
});

const ChatSettingsPanel = ({ currentUser, users, onSettingsChange }) => {
  const [activeSection, setActiveSection] = useState("Profile");
  const [profileName, setProfileName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [about, setAbout] = useState("Available");
  const [chatSettings, setChatSettings] = useState(defaultChatSettings);
  const [notificationPrefs, setNotificationPrefs] = useState(defaultNotificationPrefs);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const blockedIds = chatSettings.blockedContacts || [];

  const settingsItems = [
    { icon: <Monitor size={18} />, title: "General", text: "Startup and close" },
    { icon: <UserCircle size={18} />, title: "Profile", text: "Name, about and profile details" },
    { icon: <KeyRound size={18} />, title: "Account", text: "Security notifications, account info" },
    { icon: <Lock size={18} />, title: "Privacy", text: "Blocked contacts, visibility" },
    { icon: <MessageCircle size={18} />, title: "Chats", text: "Theme, wallpaper, chat settings" },
    { icon: <Video size={18} />, title: "Video & voice", text: "Camera, microphone and speakers" },
    { icon: <Bell size={18} />, title: "Notifications", text: "Messages, groups and sounds" },
    { icon: <Keyboard size={18} />, title: "Keyboard shortcuts", text: "Quick actions" },
    { icon: <Shield size={18} />, title: "Blocked contacts", text: `${blockedIds.length} blocked` },
  ];

  useEffect(() => {
    let mounted = true;
    const loadSettings = async () => {
      try {
        const [profileResponse, notificationResponse] = await Promise.all([
          getMyProfile(),
          getNotificationPreferences().catch(() => null),
        ]);
        if (!mounted) return;

        const profile = profileResponse.data?.data?.user || profileResponse.data?.user || currentUser || {};
        const nextSettings = mergeChatSettings(profile.chatSettings);
        setProfileName(profile.name || currentUser?.name || "");
        setEmail(profile.email || currentUser?.email || "");
        setPhone(profile.phone || currentUser?.phone || "");
        setAbout(nextSettings.about || "Available");
        setChatSettings(nextSettings);
        onSettingsChange?.(nextSettings);
        setNotificationPrefs(mergeNotificationPrefs(notificationResponse?.data?.data || profile.notificationPreferences));
      } catch {
        if (!mounted) return;
        const nextSettings = mergeChatSettings(currentUser?.chatSettings);
        setProfileName(currentUser?.name || "");
        setEmail(currentUser?.email || "");
        setPhone(currentUser?.phone || "");
        setAbout(nextSettings.about || currentUser?.about || "Available");
        setChatSettings(nextSettings);
        onSettingsChange?.(nextSettings);
      }
    };

    loadSettings();
    return () => {
      mounted = false;
    };
  }, [currentUser]);

  const normalizePhone = value => String(value || "").replace(/\D/g, "");

  const saveUserSettings = async (nextSettings = chatSettings, message = "Settings saved") => {
    setSaving(true);
    setStatus("");
    try {
      const cleanSettings = {
        ...nextSettings,
        about,
        blockedContacts: nextSettings.blockedContacts || [],
      };
      const payload = {
        chatSettings: cleanSettings,
      };

      if (activeSection === "Profile") {
        const cleanPhone = normalizePhone(phone);
        if (phone && cleanPhone.length !== 10) {
          setStatus("Phone number 10 digits ka hona chahiye");
          setSaving(false);
          return;
        }

        payload.name = profileName.trim() || currentUser?.name;
        payload.email = email.trim();
        payload.phone = cleanPhone;
      }

      const response = await updateMyProfile(payload);
      const updatedUser = response.data?.data?.user || response.data?.user || payload;
      setChatSettings(mergeChatSettings(updatedUser.chatSettings || payload.chatSettings));
      onSettingsChange?.(mergeChatSettings(updatedUser.chatSettings || payload.chatSettings));
      try {
        const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
        localStorage.setItem("user", JSON.stringify({
          ...savedUser,
          ...updatedUser,
          ...(payload.name ? { name: payload.name } : {}),
          ...(payload.email ? { email: payload.email } : {}),
          ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
          about,
          chatSettings: updatedUser.chatSettings || payload.chatSettings,
        }));
      } catch {
        void 0;
      }
      setStatus(message);
    } catch (error) {
      setStatus(error?.response?.data?.message || error?.response?.data?.error || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const saveNotificationPrefs = async nextPrefs => {
    setSaving(true);
    setStatus("");
    try {
      const response = await updateNotificationPreferences(nextPrefs);
      setNotificationPrefs(mergeNotificationPrefs(response.data?.data || nextPrefs));
      setStatus("Notification settings saved");
    } catch (error) {
      setStatus(error?.response?.data?.message || "Notification save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleBlocked = user => {
    const userId = getItemId(user);
    if (!userId) return;
    const nextBlocked = blockedIds.includes(userId)
      ? blockedIds.filter(id => id !== userId)
      : [...blockedIds, userId];
    const nextSettings = { ...chatSettings, blockedContacts: nextBlocked };
    setChatSettings(nextSettings);
    saveUserSettings(nextSettings, nextBlocked.includes(userId) ? "Contact blocked" : "Contact unblocked");
  };

  const updateChatSetting = (section, key, value) => {
    const nextSettings = {
      ...chatSettings,
      [section]: {
        ...(chatSettings[section] || {}),
        [key]: value,
      },
    };
    setChatSettings(nextSettings);
  };

  const savePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setStatus("Both password fields are required");
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      await changeMyPassword(passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setStatus("Password changed successfully");
    } catch (error) {
      setStatus(error?.response?.data?.message || error?.response?.data?.error || "Password change failed");
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = (users || []).filter(user => [
    user.name,
    user.email,
    getItemId(user),
  ].some(value => !searchTerm || String(value || "").toLowerCase().includes(searchTerm.toLowerCase())));

  const renderToggle = (checked, onChange) => (
    <button type="button" className="chat-setting-toggle" onClick={() => onChange(!checked)} aria-pressed={checked}>
      <i className={checked ? "active" : ""} />
    </button>
  );

  const renderSelect = (value, onChange, options) => (
    <select value={value} onChange={event => onChange(event.target.value)}>
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );

  const renderSettingsDetail = () => {
    if (activeSection === "Profile") {
      return (
        <div className="chat-settings-form">
          <input value={profileName} onChange={event => setProfileName(event.target.value)} placeholder="Your name" />
          <input value={email} onChange={event => setEmail(event.target.value)} placeholder="Email" />
          <input value={phone} onChange={event => setPhone(event.target.value)} placeholder="Phone" />
          <textarea value={about} onChange={event => setAbout(event.target.value)} placeholder="About" rows={3} />
          <button type="button" onClick={() => saveUserSettings()} disabled={saving}>Save profile</button>
        </div>
      );
    }

    if (activeSection === "Account") {
      return (
        <div className="chat-settings-form">
          <input type="password" value={passwordForm.currentPassword} onChange={event => setPasswordForm(prev => ({ ...prev, currentPassword: event.target.value }))} placeholder="Current password" />
          <input type="password" value={passwordForm.newPassword} onChange={event => setPasswordForm(prev => ({ ...prev, newPassword: event.target.value }))} placeholder="New password" />
          <button type="button" onClick={savePassword} disabled={saving}>Change password</button>
        </div>
      );
    }

    if (activeSection === "Privacy") {
      return (
        <div className="chat-settings-form">
          <label>Last seen {renderSelect(chatSettings.privacy.lastSeen, value => updateChatSetting("privacy", "lastSeen", value), [
            { value: "everyone", label: "Everyone" },
            { value: "contacts", label: "My contacts" },
            { value: "nobody", label: "Nobody" },
          ])}</label>
          <label>Profile photo {renderSelect(chatSettings.privacy.profilePhoto, value => updateChatSetting("privacy", "profilePhoto", value), [
            { value: "everyone", label: "Everyone" },
            { value: "contacts", label: "My contacts" },
            { value: "nobody", label: "Nobody" },
          ])}</label>
          <label>Group invites {renderSelect(chatSettings.privacy.groups, value => updateChatSetting("privacy", "groups", value), [
            { value: "everyone", label: "Everyone" },
            { value: "contacts", label: "My contacts" },
          ])}</label>
          <label>Read receipts {renderToggle(chatSettings.privacy.readReceipts, value => updateChatSetting("privacy", "readReceipts", value))}</label>
          <button type="button" onClick={() => saveUserSettings()} disabled={saving}>Save privacy</button>
        </div>
      );
    }

    if (activeSection === "Chats") {
      return (
        <div className="chat-settings-form">
          <label>Theme {renderSelect(chatSettings.chats.theme, value => updateChatSetting("chats", "theme", value), [
            { value: "system", label: "System" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ])}</label>
          <input value={chatSettings.chats.wallpaper || ""} onChange={event => updateChatSetting("chats", "wallpaper", event.target.value)} placeholder="Wallpaper URL" />
          <label>Enter to send {renderToggle(chatSettings.chats.enterToSend, value => updateChatSetting("chats", "enterToSend", value))}</label>
          <label>Media auto download {renderToggle(chatSettings.chats.mediaAutoDownload, value => updateChatSetting("chats", "mediaAutoDownload", value))}</label>
          <button type="button" onClick={() => saveUserSettings()} disabled={saving}>Save chats</button>
        </div>
      );
    }

    if (activeSection === "Video & voice") {
      return (
        <div className="chat-settings-form">
          <label>Camera {renderToggle(chatSettings.videoVoice.cameraEnabled, value => updateChatSetting("videoVoice", "cameraEnabled", value))}</label>
          <label>Microphone {renderToggle(chatSettings.videoVoice.microphoneEnabled, value => updateChatSetting("videoVoice", "microphoneEnabled", value))}</label>
          <label>Speaker {renderToggle(chatSettings.videoVoice.speakerEnabled, value => updateChatSetting("videoVoice", "speakerEnabled", value))}</label>
          <button type="button" onClick={() => saveUserSettings()} disabled={saving}>Save video & voice</button>
        </div>
      );
    }

    if (activeSection === "Notifications") {
      const updateChannel = (key, value) => {
        const nextPrefs = {
          ...notificationPrefs,
          channels: { ...notificationPrefs.channels, [key]: value },
        };
        setNotificationPrefs(nextPrefs);
      };
      return (
        <div className="chat-settings-form">
          <label>Web notifications {renderToggle(notificationPrefs.web, value => setNotificationPrefs(prev => ({ ...prev, web: value })))}</label>
          <label>Push notifications {renderToggle(notificationPrefs.push, value => setNotificationPrefs(prev => ({ ...prev, push: value })))}</label>
          <label>Email notifications {renderToggle(notificationPrefs.email, value => setNotificationPrefs(prev => ({ ...prev, email: value })))}</label>
          <label>Chat messages {renderToggle(notificationPrefs.channels.chats, value => updateChannel("chats", value))}</label>
          <label>Tasks {renderToggle(notificationPrefs.channels.taskAssigned, value => updateChannel("taskAssigned", value))}</label>
          <label>Projects {renderToggle(notificationPrefs.channels.projects, value => updateChannel("projects", value))}</label>
          <input type="time" value={notificationPrefs.quietHours.start || ""} onChange={event => setNotificationPrefs(prev => ({ ...prev, quietHours: { ...prev.quietHours, start: event.target.value } }))} />
          <input type="time" value={notificationPrefs.quietHours.end || ""} onChange={event => setNotificationPrefs(prev => ({ ...prev, quietHours: { ...prev.quietHours, end: event.target.value } }))} />
          <button type="button" onClick={() => saveNotificationPrefs(notificationPrefs)} disabled={saving}>Save notifications</button>
        </div>
      );
    }

    if (activeSection === "General") {
      return (
        <div className="chat-settings-form">
          <label>Start with system {renderToggle(chatSettings.general.startWithSystem, value => updateChatSetting("general", "startWithSystem", value))}</label>
          <label>Keep logged in {renderToggle(chatSettings.general.keepLoggedIn, value => updateChatSetting("general", "keepLoggedIn", value))}</label>
          <label>Compact mode {renderToggle(chatSettings.general.compactMode, value => updateChatSetting("general", "compactMode", value))}</label>
          <button type="button" onClick={() => saveUserSettings()} disabled={saving}>Save general</button>
        </div>
      );
    }

    if (activeSection === "Keyboard shortcuts") {
      return (
        <div className="chat-settings-form">
          <label>Keyboard shortcuts {renderToggle(chatSettings.keyboard.enabled, value => updateChatSetting("keyboard", "enabled", value))}</label>
          <input value={chatSettings.keyboard.sendMessage} onChange={event => updateChatSetting("keyboard", "sendMessage", event.target.value)} placeholder="Send shortcut" />
          <input value={chatSettings.keyboard.newLine} onChange={event => updateChatSetting("keyboard", "newLine", event.target.value)} placeholder="New line shortcut" />
          <button type="button" onClick={() => saveUserSettings()} disabled={saving}>Save shortcuts</button>
        </div>
      );
    }

    return (
      <div className="chat-block-section">
        <div className="chat-group-search">
          <Search size={16} />
          <input value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Search contacts to block" />
        </div>
        <div className="chat-block-list">
          {filteredUsers.slice(0, 20).map(user => {
            const userId = getItemId(user);
            const blocked = blockedIds.includes(userId);
            return (
              <button type="button" key={userId} onClick={() => toggleBlocked(user)}>
                <span className="chat-settings-mini-avatar">{user.name?.charAt(0).toUpperCase() || "U"}</span>
                <span><strong>{user.name || user.email || userId}</strong><small>{blocked ? "Blocked" : "Allowed"}</small></span>
                <i className={blocked ? "active" : ""} />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <aside className="chat-sidebar chat-settings-panel">
      <section className="chat-sidebar-card conversations-card">
        <div className="sidebar-top">
          <div>
            <div className="sidebar-title">Settings</div>
            <div className="sidebar-subtitle">Profile, privacy and chat controls</div>
          </div>
        </div>
        <div className="chat-settings-scroll">
          <div className="chat-settings-profile">
            <div className="chat-settings-avatar">{profileName?.charAt(0).toUpperCase() || "U"}</div>
            <strong>{profileName || "User"}</strong>
            <small>{about || "Available"}</small>
          </div>

          <div className="chat-settings-list">
            {settingsItems.map(item => (
              <button type="button" key={item.title} className={activeSection === item.title ? "active" : ""} onClick={() => setActiveSection(item.title)}>
                {item.icon}
                <span><strong>{item.title}</strong><small>{item.text}</small></span>
              </button>
            ))}
          </div>
        </div>
        <div className="chat-settings-active">
          <div className="chat-block-head">
            <Shield size={17} />
            <span><strong>{activeSection}</strong><small>{status || "Backend synced"}</small></span>
          </div>
          {renderSettingsDetail()}
        </div>
      </section>
    </aside>
  );
};

const ChatPage = () => {
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeView, setActiveView] = useState("chats");
  const [selectedCallId, setSelectedCallId] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [groups, setGroups] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [effectiveChatSettings, setEffectiveChatSettings] = useState(() => mergeChatSettings(currentUser?.chatSettings));

  const socketContext = useSocket();
  const { startCall, callHistory, clearCallHistory } = useCall();
  const socket = socketContext?.socket;
  const isSocketConnected = socketContext?.isConnected;
  const currentUserId = (currentUser._id || currentUser.id || "").toString();
  const statusStorageKey = `ciis-chat-statuses-${currentUserId || "user"}`;

  const findDirectConversation = user => conversations.find(conversation => {
    if (conversation.isGroup) return false;
    const memberIds = (conversation.members || []).map(member => (member?._id || member?.id || member).toString());
    return memberIds.includes((user._id || user.id).toString());
  });

  const findGroupConversation = group => conversations.find(conversation => (
    conversation.isGroup && (conversation.groupId?._id || conversation.groupId || "").toString() === (group._id || group.id).toString()
  ));

  const sortByConversation = (items, resolver) => [...items].sort((first, second) => {
    const firstConversation = resolver(first);
    const secondConversation = resolver(second);
    const firstTime = new Date(firstConversation?.lastMessage?.createdAt || firstConversation?.updatedAt || 0).getTime();
    const secondTime = new Date(secondConversation?.lastMessage?.createdAt || secondConversation?.updatedAt || 0).getTime();
    return secondTime - firstTime;
  });

  const getUnreadOverride = (...keys) => {
    for (const key of keys) {
      if (key && Object.prototype.hasOwnProperty.call(unreadCounts, key)) {
        return unreadCounts[key];
      }
    }

    return undefined;
  };

  const enrichedUsers = sortByConversation(users.map(user => {
    const conversation = findDirectConversation(user);
    const userId = (user._id || user.id || "").toString();
    const conversationId = conversation?._id?.toString();
    const unreadOverride = getUnreadOverride(conversationId, userId);
    return {
      ...user,
      conversation,
      unreadCount: unreadOverride ?? conversation?.unreadCount ?? 0,
      lastMessage: conversation?.lastMessage,
    };
  }), user => user.conversation);

  const isVisibleGroupForCurrentUser = group => {
    if (!currentUserId) return true;
    const memberIds = (group.members || group.users || group.memberIds || group.membersIds || []).map(getEntityId);
    const creatorId = getEntityId(group.createdBy);
    return memberIds.includes(currentUserId) || creatorId === currentUserId;
  };

  const visibleGroups = groups.filter(isVisibleGroupForCurrentUser);

  const enrichedGroups = sortByConversation(visibleGroups.map(group => {
    const conversation = findGroupConversation(group);
    const conversationId = conversation?._id?.toString();
    const groupId = (group._id || group.id || "").toString();
    const unreadOverride = getUnreadOverride(conversationId, groupId);
    return {
      ...group,
      isGroup: true,
      conversation,
      unreadCount: unreadOverride ?? conversation?.unreadCount ?? 0,
      lastMessage: conversation?.lastMessage,
    };
  }), group => group.conversation);

  const fetchConversations = async () => {
    try {
      const res = await getConversations();
      setConversations(res.data.conversations || []);
    } catch (error) {
      void 0;
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await getCompanyGroups();
      const fetchedGroups = res.data.groups || res.data.data || res.data || [];
      setGroups(Array.isArray(fetchedGroups) ? fetchedGroups : []);
    } catch (error) {
      void 0;
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await getCompanyUsers();
      const nextUsers = res.data.users || [];
      setUsers(nextUsers.map(user => {
        const userId = getEntityId(user);
        return {
          ...user,
          isOnline: isTruthyOnline(user.isOnline || user.online || user.status) || onlineUsers.includes(userId),
        };
      }));
      setSelectedUser(prev => {
        if (!prev || prev.isGroup) return prev;
        const previousId = (prev._id || prev.id || "").toString();
        const freshUser = nextUsers.find(user => (user._id || user.id || "").toString() === previousId);
        if (!freshUser) return prev;

        const nextIsOnline = isTruthyOnline(freshUser.isOnline || freshUser.online || freshUser.status) || onlineUsers.includes(previousId);
        if (Boolean(prev.isOnline) === nextIsOnline && prev.lastSeen === freshUser.lastSeen) {
          return prev;
        }

        return {
          ...prev,
          isOnline: nextIsOnline,
          lastSeen: freshUser.lastSeen,
        };
      });
    } catch (error) {
      void 0;
    }
  };

  const handleCreateGroup = async ({ name, members }) => {
    const response = await createCompanyGroup({ name, members });
    const group = response.data.group || response.data.data || response.data;
    await fetchGroups();

    if (group?._id || group?.id) {
      await createGroupConversation(group._id || group.id);
      await fetchConversations();
      setSelectedUser({ ...group, isGroup: true });
      setActiveView("chats");
    }
  };

  const addStatus = status => {
    const nextStatus = {
      id: `${Date.now()}`,
      text: status.text || "",
      image: status.image || "",
      createdAt: new Date().toISOString(),
    };

    setStatuses(prev => {
      const next = [nextStatus, ...prev].slice(0, 20);
      try {
        localStorage.setItem(statusStorageKey, JSON.stringify(next));
      } catch {
        void 0;
      }
      return next;
    });
  };

  const deleteStatus = statusId => {
    setStatuses(prev => {
      const next = statusId
        ? prev.filter(status => status.id !== statusId)
        : prev.slice(1);
      try {
        localStorage.setItem(statusStorageKey, JSON.stringify(next));
      } catch {
        void 0;
      }
      return next;
    });
  };

  useEffect(() => {
    fetchUsers();
    fetchGroups();
    fetchConversations();

    const userRefreshTimer = window.setInterval(fetchUsers, 60000);

    return () => {
      window.clearInterval(userRefreshTimer);
    };
  }, []);

  useEffect(() => {
    document.body.classList.add("chat-route-active");

    return () => {
      document.body.classList.remove("chat-route-active");
    };
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(statusStorageKey) || "[]");
      setStatuses(Array.isArray(saved) ? saved : []);
    } catch {
      setStatuses([]);
    }
  }, [statusStorageKey]);

  useEffect(() => {
    if (!socket) return undefined;

    const selectedUserId = (selectedUser?._id || selectedUser?.id || "").toString();
    const selectedConversationId = selectedUser?.conversation?._id?.toString();

    const handleOnline = nextUsers => {
      const onlineIds = normalizeOnlineUserIds(nextUsers);
      setOnlineUsers(onlineIds);
      setUsers(prev => prev.map(user => {
        const userId = getEntityId(user);
        return {...user, isOnline: Boolean(userId && onlineIds.includes(userId))};
      }));
      setSelectedUser(prev => {
        if (!prev || prev.isGroup) return prev;
        const selectedId = (prev._id || prev.id || "").toString();
        const nextIsOnline = Boolean(selectedId && onlineIds.includes(selectedId));
        return Boolean(prev.isOnline) === nextIsOnline ? prev : {...prev, isOnline: nextIsOnline};
      });
    };

    const setSingleUserPresence = (payload, nextIsOnline) => {
      const userId = getEntityId(payload?.user || payload?.userId || payload);
      if (!userId) return;

      setOnlineUsers(prev => {
        const withoutUser = prev.filter(id => id?.toString() !== userId);
        return nextIsOnline ? [...withoutUser, userId] : withoutUser;
      });
      setUsers(prev => prev.map(user => (
        getEntityId(user) === userId ? { ...user, isOnline: nextIsOnline } : user
      )));
      setSelectedUser(prev => (
        prev && !prev.isGroup && getEntityId(prev) === userId
          ? { ...prev, isOnline: nextIsOnline }
          : prev
      ));
    };

    const handleDisconnect = () => handleOnline([]);
    const handleChatUserOnline = data => setSingleUserPresence(data, true);
    const handleChatUserOffline = data => setSingleUserPresence(data, false);

    const refreshOnlineUsers = () => {
      if (!socket.connected) {
        handleOnline([]);
        return;
      }
      socket.emit("chat:get-online-users", users => {
        handleOnline(users);
      });
    };

    const handleUnread = data => {
      const conversationId = data.conversationId?.toString();
      const senderId = data.senderId?.toString();
      const nextCount = conversationId === selectedConversationId || senderId === selectedUserId
        ? 0
        : data.count || 0;

      setUnreadCounts(prev => ({
        ...prev,
        ...(conversationId ? {[conversationId]: nextCount} : {}),
        ...(senderId ? {[senderId]: nextCount} : {}),
      }));
      fetchConversations();
    };

    socket.on("chat:online-users", handleOnline);
    socket.on("chat:user-online", handleChatUserOnline);
    socket.on("chat:user-offline", handleChatUserOffline);
    socket.on("user:online", handleChatUserOnline);
    socket.on("user:offline", handleChatUserOffline);
    socket.on("chat:unread-update", handleUnread);
    socket.on("connect", refreshOnlineUsers);
    socket.on("disconnect", handleDisconnect);
    socket.io?.on("reconnect", refreshOnlineUsers);
    refreshOnlineUsers();
    const refreshTimer = window.setInterval(refreshOnlineUsers, 30000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshOnlineUsers();
        fetchUsers();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      socket.off("chat:online-users", handleOnline);
      socket.off("chat:user-online", handleChatUserOnline);
      socket.off("chat:user-offline", handleChatUserOffline);
      socket.off("user:online", handleChatUserOnline);
      socket.off("user:offline", handleChatUserOffline);
      socket.off("chat:unread-update", handleUnread);
      socket.off("connect", refreshOnlineUsers);
      socket.off("disconnect", handleDisconnect);
      socket.io?.off("reconnect", refreshOnlineUsers);
      window.clearInterval(refreshTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    socket,
    selectedUser?._id,
    selectedUser?.id,
    selectedUser?.conversation?._id,
    isSocketConnected,
  ]);

  useEffect(() => {
    if (!selectedUser) return;

    const selectedUserId = (selectedUser._id || selectedUser.id || "").toString();
    const conversationId = selectedUser.conversation?._id?.toString();

    setUnreadCounts(prev => ({
      ...prev,
      ...(selectedUserId ? {[selectedUserId]: 0} : {}),
      ...(conversationId ? {[conversationId]: 0} : {}),
    }));
  }, [selectedUser]);

  return (
    <div className={`chat-page ${selectedUser ? "has-selected-chat" : "is-chat-list"} view-${activeView} chat-theme-${effectiveChatSettings.chats.theme || "system"} ${effectiveChatSettings.general.compactMode ? "chat-compact-mode" : ""}`}>
      <aside className="chat-app-rail">
        <div className="chat-rail-profile">
          <div className="chat-rail-avatar">
            {currentUser?.avatar || currentUser?.profileImage || currentUser?.image ? (
              <img src={currentUser.avatar || currentUser.profileImage || currentUser.image} alt={currentUser.name || "User"} />
            ) : (
              (currentUser?.name || "U").charAt(0).toUpperCase()
            )}
          </div>
          <span />
        </div>
        <nav className="chat-rail-nav" aria-label="Chat navigation">
          <button type="button" className={activeView === "chats" ? "active" : ""} onClick={() => setActiveView("chats")} title="Chats"><MessageCircle size={20} /><span>Chats</span></button>
          <button type="button" className={activeView === "status" ? "active" : ""} onClick={() => setActiveView("status")} title="Status"><TimerReset size={20} /><span>Status</span></button>
          <button type="button" className={activeView === "calls" ? "active" : ""} onClick={() => setActiveView("calls")} title="Calls"><Phone size={20} /><span>Calls</span></button>
          <button type="button" className={activeView === "communities" ? "active" : ""} onClick={() => setActiveView("communities")} title="Groups"><Users size={20} /><span>Groups</span></button>
        </nav>
        <div className="chat-rail-bottom">
          <button type="button" className={activeView === "settings" ? "active" : ""} onClick={() => setActiveView("settings")} title="Settings"><Settings size={20} /><span>Settings</span></button>
        </div>
      </aside>
      {activeView === "chats" && (
        <ChatSidebar
          users={enrichedUsers}
          groups={enrichedGroups}
          onlineUsers={onlineUsers}
          unreadCounts={unreadCounts}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          currentUserId={currentUserId}
          companyUsers={users}
          onCreateGroup={handleCreateGroup}
        />
      )}

      {activeView === "status" && (
        <ChatStatusPanel
          users={enrichedUsers}
          groups={enrichedGroups}
          statuses={statuses}
          addStatus={addStatus}
          deleteStatus={deleteStatus}
          setSelectedUser={setSelectedUser}
          onOpenChats={() => setActiveView("chats")}
        />
      )}

      {activeView === "calls" && (
        <ChatCallsPanel
          calls={callHistory}
          users={enrichedUsers}
          groups={enrichedGroups}
          selectedCallId={selectedCallId}
          setSelectedCallId={setSelectedCallId}
          startCall={startCall}
          clearCallHistory={clearCallHistory}
        />
      )}

      {activeView === "communities" && (
        <ChatStatusPanel
          users={[]}
          groups={enrichedGroups}
          statuses={[]}
          addStatus={() => {}}
          deleteStatus={() => {}}
          setSelectedUser={setSelectedUser}
          onOpenChats={() => setActiveView("chats")}
          title="Groups"
          subtitle={`${enrichedGroups.length} group conversations`}
        />
      )}

      {activeView === "settings" && (
        <ChatSettingsPanel currentUser={currentUser} users={users} onSettingsChange={setEffectiveChatSettings} />
      )}

      {activeView === "calls" ? (
        <ChatCallsDetail
          call={callHistory.find(call => call.callId === selectedCallId)}
          users={enrichedUsers}
          groups={enrichedGroups}
          startCall={startCall}
        />
      ) : activeView === "settings" ? (
        <section className="chat-empty chat-settings-detail">
          <div className="chat-empty-card">
            <Settings size={34} />
            <h2>Settings</h2>
            <p>Update profile, privacy, blocked contacts and chat preferences from the settings panel.</p>
          </div>
        </section>
      ) : (
        <ChatBox
          selectedUser={selectedUser}
          currentUser={currentUser}
          users={users}
          socket={socket}
          onlineUsers={onlineUsers}
          onConversationChange={fetchConversations}
          onBack={() => setSelectedUser(null)}
          chatSettings={effectiveChatSettings}
        />
      )}
    </div>
  );
};

export default ChatPage;
