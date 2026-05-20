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
        `${API_URL}/groups`,
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
