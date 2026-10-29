import axios from "axios";
import API_URL from "../config";

const API = `${API_URL}/chat`;

const getToken = () => {
    return localStorage.getItem("token");
};

// Share concurrent reads from the full chat page, popup and socket callbacks.
// Keep completed responses uncached so membership changes remain visible.
const pendingChatReads = new Map();
const chatRead = (key, load) => {
    const token = getToken();
    const requestKey = `${token}:${key}`;
    if (pendingChatReads.has(requestKey)) return pendingChatReads.get(requestKey);
    const request = Promise.resolve().then(() => load(token)).finally(() => pendingChatReads.delete(requestKey));
    pendingChatReads.set(requestKey, request);
    return request;
};
    
export const getCompanyUsers = () => chatRead('users', token => axios.get(`${API}/users`, {
    headers: { Authorization: `Bearer ${token}` }, timeout: 20000,
}));

export const getAllCompanyUsers = async () => {
    return axios.get(
        `${API_URL}/users/company-users`,
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );
};

export const getMyProfile = async () => {
    return axios.get(
        `${API_URL}/users/me`,
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );
};

export const updateMyProfile = async (payload) => {
    return axios.put(
        `${API_URL}/users/me`,
        payload,
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );
};

export const changeMyPassword = async ({ currentPassword, newPassword }) => {
    return axios.put(
        `${API_URL}/users/change-password`,
        { currentPassword, newPassword },
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );
};

export const getNotificationPreferences = async () => {
    return axios.get(
        `${API_URL}/notifications/preferences`,
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );
};

export const updateNotificationPreferences = async (notificationPreferences) => {
    return axios.put(
        `${API_URL}/notifications/preferences`,
        { notificationPreferences },
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );
};

const buildGroupPayload = ({ name, description = "", members = [], avatar = null }) => {
    if (!avatar) return { name, description, members };

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    members.forEach(memberId => formData.append("members[]", memberId));
    formData.append("avatar", avatar);
    return formData;
};

export const createCompanyGroup = async ({ name, description = "", members = [], avatar = null }) => {
    const payload = buildGroupPayload({ name, description, members, avatar });
    return axios.post(
        `${API_URL}/groups`,
        payload,
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );
};

export const updateCompanyGroup = async (groupId, { name, description = "", members, avatar = null }) => {
    const payload = buildGroupPayload({ name, description, members: members || [], avatar });
    if (!avatar && members === undefined) {
        delete payload.members;
    }
    return axios.put(
        `${API_URL}/groups/${groupId}`,
        payload,
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );
};

export const deleteCompanyGroup = async (groupId) => {
    return axios.delete(
        `${API_URL}/groups/${groupId}`,
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );
};

export const getConversations = () => chatRead('conversations', async token => {
    const conversations = new Map();
    let cursor;
    let beforeId;
    let response;
    do {
        response = await axios.get(`${API}/conversations`, {
            headers: { Authorization: `Bearer ${token}` }, timeout: 20000,
            params: { limit: 100, ...(cursor ? { before: cursor, beforeId } : {}) },
        });
        for (const conversation of response.data.conversations || []) conversations.set(conversation._id, conversation);
        const pagination = response.data.pagination;
        if (!pagination?.hasMore || !pagination.nextCursor) break;
        const nextId = pagination.nextId;
        if (cursor === pagination.nextCursor && beforeId === nextId) break;
        cursor = pagination.nextCursor;
        beforeId = nextId;
    } while (true);
    return { ...response, data: { ...response.data, conversations: [...conversations.values()] } };
});

export const createConversation = async (
    receiverId
) => {

    return axios.post(
        `${API}/conversation`,  
        { receiverId },
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );
};

export const createGroupConversation = async (
    groupId
) => {

    return axios.post(
        `${API}/conversation/group`,
        { groupId },
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );
};

export const getMessages = async (
    conversationId,
    params = {}
) => {

    return axios.get(
        `${API}/messages/${conversationId}`,
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            },
            params
        }
    );
};

export const sendMessage =
async (formData) => {

    return axios.post(

        `${API}/message`,

        formData,

        {
            headers: {

                Authorization:
                    `Bearer ${getToken()}`
            },
            timeout: 0,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            _skipErrorNotify: true
        }
    );
};

export const getCompanyGroups = () => chatRead('groups', token => axios.get(`${API}/groups`, {
    headers: { Authorization: `Bearer ${token}` }, timeout: 20000,
}));

export const markMessageSeen = async (messageId) => {
    return axios.patch(
        `${API}/message/${messageId}/seen`,
        {},
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );
};

export const deleteMessageForMe = async (messageId) => {
    return axios.patch(
        `${API}/message/${messageId}/delete-for-me`,
        {},
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );
};

export const deleteMessageForEveryone = async (messageId) => {
    return axios.patch(
        `${API}/message/${messageId}/delete-for-everyone`,
        {},
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );
};

export const forwardMessage = async ({ messageId, targetUserIds = [] }) => {
    return axios.post(
        `${API}/message/${messageId}/forward`,
        { targetUserIds },
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );
};

export const updateConversationMute = async (conversationId, muted, mutedUntil = null) => {
    return axios.patch(
        `${API}/conversation/${conversationId}/mute`,
        { muted, mutedUntil },
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );
};

export const updateDisappearingMessages = async (conversationId, mode) => {
    return axios.patch(
        `${API}/conversation/${conversationId}/disappearing-messages`,
        { mode },
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );
};

export const updateMessageReaction = async (messageId, emoji) => {
    return axios.patch(
        `${API}/message/${messageId}/reaction`,
        { emoji },
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );
};

const authConfig = () => ({
    headers: { Authorization: `Bearer ${getToken()}` }
});

export const getStatuses = async () => axios.get(`${API}/statuses`, authConfig());

export const createStatus = async ({ text = "", file = null, backgroundColor = "#256c62" }) => {
    const formData = new FormData();
    if (text) formData.append("text", text);
    if (file) formData.append("file", file);
    formData.append("backgroundColor", backgroundColor);
    return axios.post(`${API}/statuses`, formData, authConfig());
};

export const markStatusViewed = async statusId =>
    axios.patch(`${API}/statuses/${statusId}/view`, {}, authConfig());

export const deleteStatus = async statusId =>
    axios.delete(`${API}/statuses/${statusId}`, authConfig());

export const openProjectConversation = projectId => axios.post(`${API}/conversation/group`, { projectId }, { headers: { Authorization: `Bearer ${getToken()}` } });
export const getProjectChatTask = (projectId, taskId) => axios.get(`${API}/project-task/${projectId}/${taskId}`, { headers: { Authorization: `Bearer ${getToken()}` } });
export const addProjectChatRemark = (projectId, taskId, text, mentions, requestId) => axios.post(`${API_URL}/projects/${projectId}/tasks/${taskId}/remarks`, { text, mentions }, { headers: { Authorization: `Bearer ${getToken()}`, "Idempotency-Key": requestId } });

export const openClientConversation = clientId => axios.post(`${API}/conversation/group`, { clientId }, { headers: { Authorization: `Bearer ${getToken()}` } });
export const getClientChatTask = (clientId, taskId) => axios.get(`${API}/client-task/${clientId}/${taskId}`, { headers: { Authorization: `Bearer ${getToken()}` } });
export const addClientChatRemark = (clientId, taskId, text, mentions, requestId) => axios.post(`${API}/client-task/${clientId}/${taskId}/remarks`, { text, mentions }, { headers: { Authorization: `Bearer ${getToken()}`, 'Idempotency-Key': requestId } });
