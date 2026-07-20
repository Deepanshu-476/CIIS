import axios from "axios";
import API_URL from "../config";

const API = `${API_URL}/chat`;

const getToken = () => {
    return localStorage.getItem("token");
};
    
export const getCompanyUsers = async () => {

    return axios.get(
        `${API}/users`,
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );
};

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

export const createCompanyGroup = async ({ name, description = "", members = [] }) => {
    return axios.post(
        `${API_URL}/groups`,
        { name, description, members },
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );
};

export const getConversations = async () => {

    return axios.get(
        `${API}/conversations`,
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
                
            }
        }
    );
};

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
    conversationId
) => {

    return axios.get(
        `${API}/messages/${conversationId}`,
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
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
            }
        }
    );
};

export const getCompanyGroups = async () => {
    return axios.get(
        `${API}/groups`,
        {
            headers: {
                Authorization: `Bearer ${getToken()}`
            }
        }
    );
};

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

export const createStatus = async ({ text = "", file = null }) => {
    const formData = new FormData();
    if (text) formData.append("text", text);
    if (file) formData.append("file", file);
    return axios.post(`${API}/statuses`, formData, authConfig());
};

export const markStatusViewed = async statusId =>
    axios.patch(`${API}/statuses/${statusId}/view`, {}, authConfig());

export const deleteStatus = async statusId =>
    axios.delete(`${API}/statuses/${statusId}`, authConfig());
