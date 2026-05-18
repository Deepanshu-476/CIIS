import axios from "axios";

const API = "http://localhost:3000/api/chat";

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
                    `Bearer ${getToken()}`,

                "Content-Type":
                    "multipart/form-data"
            }
        }
    );
};