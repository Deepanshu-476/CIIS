import React, { useEffect, useState } from "react";
import axios from "../../../utils/axiosConfig";
import API_URL from "../../../config";
import { toast } from "react-toastify";
import "./AdminMeetingPage.css"; 
import { useSocket } from '../../../context/SocketContext';
import { useNotification } from '../../../context/NotificationContext';
import { useCall } from "../../../context/CallContext";

export default function AdminMeetingPage() {
  const [meetingAudience, setMeetingAudience] = useState("employee");
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [clientMeetings, setClientMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  const [statusModal, setStatusModal] = useState({ open: false, data: [], meetingTitle: "" });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, meetingId: null, meetingTitle: "" });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState({ show: false, message: "" });
  const [companyCode, setCompanyCode] = useState("");
  
  
  const { 
    socket, 
    isConnected,
    onNewNotification,
    onMeetingUpdate,
    onMeetingReminder
  } = useSocket();
  
  const { showToast } = useNotification();
  const { startCall } = useCall();

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    dates: [], 
    time: "",
    recurring: "No",
    attendees: [],
    link: "", 
  });

  const [clientForm, setClientForm] = useState({
    title: "",
    description: "",
    meetingDate: "",
    dates: [],
    meetingTime: "",
    recurring: "No",
    clientId: "",
    attendees: [],
    meetingType: "Online",
    priority: "Normal",
    location: "",
    link: "",
    duration: "30",
    followUpRequired: "No",
  });

  const [currentDateInput, setCurrentDateInput] = useState("");
  const [currentClientDateInput, setCurrentClientDateInput] = useState("");
  const [groups, setGroups] = useState([]);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [editingClientMeeting, setEditingClientMeeting] = useState(null);

  const adminId = localStorage.getItem("userId");

  
  useEffect(() => {
    void 0;

    
    const unsubscribeNewMeeting = onNewNotification?.((data) => {
      void 0;
      
      showToast?.(`📅 New Meeting: ${data.title || 'Meeting Scheduled'}`, 'info', 5000);
      
      
      fetchMeetings();
    });

    
    const unsubscribeMeetingUpdate = onMeetingUpdate?.((data) => {
      void 0;
      showToast?.(`✏️ Meeting Updated: ${data.title || 'Meeting Details Changed'}`, 'info', 5000);
      fetchMeetings();
    });

    
    const unsubscribeMeetingReminder = onMeetingReminder?.((data) => {
      void 0;
      showToast?.(`⏰ Reminder: ${data.title} starts soon!`, 'warning', 10000);
    });

    
    return () => {
      void 0;
      unsubscribeNewMeeting?.();
      unsubscribeMeetingUpdate?.();
      unsubscribeMeetingReminder?.();
    };
  }, [onNewNotification, onMeetingUpdate, onMeetingReminder]);

  
  const getCompanyCodeFromUsers = (usersList) => {
    if (usersList && usersList.length > 0 && usersList[0].companyCode) {
      const code = usersList[0].companyCode;
      localStorage.setItem("companyCode", code);
      setCompanyCode(code);
      return code;
    }
    const storedCode = localStorage.getItem("companyCode") || "CAREER";
    setCompanyCode(storedCode);
    return storedCode;
  };

  
  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/users/company-users`);
      if (res.data?.success && res.data.message?.users) {
        const fetchedUsers = res.data.message.users || [];
        setUsers(fetchedUsers);
        
        if (fetchedUsers.length > 0 && fetchedUsers[0].companyCode) {
          const code = fetchedUsers[0].companyCode;
          localStorage.setItem("companyCode", code);
          setCompanyCode(code);
          void 0;
        }
      } else {
        console.warn("Unexpected API response structure:", res.data);
        setUsers([]);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("❌ Failed to load users");
      setUsers([]);
    }
  };

  
  const fetchMeetings = async () => {
    try {
      setRefreshing(true);
      
      const currentCompanyCode = companyCode || localStorage.getItem("companyCode") || "CAREER";
      
      void 0;
      
      let fetchedMeetings = [];
      
      try {
        const res = await axios.get(`${API_URL}/meetings`, {
          params: { companyCode: currentCompanyCode, page: 1, limit: 100 }
        });
        
        if (Array.isArray(res.data)) {
          fetchedMeetings = res.data;
        } else if (res.data?.data) {
          fetchedMeetings = res.data.data;
        } else if (res.data?.meetings) {
          fetchedMeetings = res.data.meetings;
        } else if (res.data?.success && res.data.data) {
          fetchedMeetings = res.data.data;
        }
      } catch (err) {
        void 0;
        
        try {
          const res = await axios.post(`${API_URL}/meetings/company-meetings`, {
            companyCode: currentCompanyCode
          });
          
          if (Array.isArray(res.data)) {
            fetchedMeetings = res.data;
          } else if (res.data?.data) {
            fetchedMeetings = res.data.data;
          } else if (res.data?.meetings) {
            fetchedMeetings = res.data.meetings;
          }
        } catch (err2) {
          void 0;
          
          const res = await axios.get(`${API_URL}/meetings`, {
            params: { page: 1, limit: 100 }
          });
          
          if (Array.isArray(res.data)) {
            fetchedMeetings = res.data;
          } else if (res.data?.data) {
            fetchedMeetings = res.data.data;
          } else if (res.data?.meetings) {
            fetchedMeetings = res.data.meetings;
          } else if (res.data?.success && res.data.data) {
            fetchedMeetings = res.data.data;
          }
          
          fetchedMeetings = fetchedMeetings.filter(meeting => {
            return meeting.companyCode === currentCompanyCode || 
                   meeting.company === currentCompanyCode ||
                   meeting.companyId === currentCompanyCode ||
                   !meeting.companyCode;
          });
        }
      }
      
      fetchedMeetings = fetchedMeetings.filter(meeting => {
        const meetingCompanyCode = meeting.companyCode || meeting.company || meeting.companyId;
        return !meetingCompanyCode || meetingCompanyCode === currentCompanyCode;
      });
      
      void 0;
      
      if (fetchedMeetings.length > 0) {
        void 0;
      }
      
      setMeetings(fetchedMeetings);
    } catch (err) {
      console.error("Error fetching meetings:", err);
      toast.error("❌ Failed to fetch meetings");
      setMeetings([]);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchClients = async () => {
    try {
      const currentCompanyCode = companyCode || localStorage.getItem("companyCode") || "CAREER";
      const res = await axios.get(`${API_URL}/clientsservice/company/${currentCompanyCode}`, {
        params: { page: 1, limit: 100 }
      });
      const fetchedClients = Array.isArray(res.data?.data) ? res.data.data : [];
      setClients(fetchedClients);
    } catch (err) {
      console.error("Error fetching clients:", err);
      toast.error("Failed to load clients");
      setClients([]);
    }
  };

  const fetchClientMeetings = async () => {
    try {
      setRefreshing(true);
      const currentCompanyCode = companyCode || localStorage.getItem("companyCode") || "CAREER";
      const res = await axios.get(`${API_URL}/cmeeting`, {
        params: { companyCode: currentCompanyCode, page: 1, limit: 100 }
      });
      const fetchedClientMeetings = Array.isArray(res.data?.data) ? res.data.data : [];
      setClientMeetings(fetchedClientMeetings);
    } catch (err) {
      console.error("Error fetching client meetings:", err);
      toast.error("Failed to fetch client meetings");
      setClientMeetings([]);
    } finally {
      setRefreshing(false);
    }
  };

  
  useEffect(() => {
    const initializeData = async () => {
      await fetchUsers();
      fetchGroups();
      fetchClients();
      setTimeout(() => {
        fetchMeetings();
        fetchClientMeetings();
      }, 100);
    };
    
    initializeData();
  }, []);

  
  const fetchGroups = async () => {
    try {
      const res = await axios.get(`${API_URL}/groups`);
      setGroups(res.data?.groups || res.data || []);
    } catch (err) {
      console.error("Error fetching groups:", err);
    }
  };

  
  const toggleGroupSelection = (group) => {
    if (!group.members || group.members.length === 0) return;
    
    const memberIds = group.members.map(m => (typeof m === 'object' ? (m._id || m.id) : m).toString());
    const allSelected = memberIds.every(id => form.attendees.includes(id));
    
    setForm(prev => {
      const updatedAttendees = allSelected
        ? prev.attendees.filter(id => !memberIds.includes(id))
        : [...new Set([...prev.attendees, ...memberIds])];
      return { ...prev, attendees: updatedAttendees };
    });
  };

  
  const toggleEditGroupSelection = (group) => {
    if (!group.members || group.members.length === 0 || !editingMeeting) return;
    
    const memberIds = group.members.map(m => (typeof m === 'object' ? (m._id || m.id) : m).toString());
    const allSelected = memberIds.every(id => editingMeeting.attendees.includes(id));
    
    setEditingMeeting(prev => {
      const updatedAttendees = allSelected
        ? prev.attendees.filter(id => !memberIds.includes(id))
        : [...new Set([...prev.attendees, ...memberIds])];
      return { ...prev, attendees: updatedAttendees };
    });
  };

  
  const addMeetingDate = () => {
    if (!currentDateInput) return;
    if (form.dates.includes(currentDateInput)) {
      toast.warning("Date already added");
      return;
    }
    setForm(prev => ({
      ...prev,
      dates: [...prev.dates, currentDateInput]
    }));
    setCurrentDateInput("");
  };

  
  const removeMeetingDate = (dateToRemove) => {
    setForm(prev => ({
      ...prev,
      dates: prev.dates.filter(d => d !== dateToRemove)
    }));
  };

  
  const startEditing = (meeting) => {
    const formattedDate = meeting.date ? new Date(meeting.date).toISOString().split('T')[0] : "";
    setEditingMeeting({
      _id: meeting._id,
      title: meeting.title || "",
      description: meeting.description || "",
      date: formattedDate,
      time: meeting.time || "",
      recurring: meeting.recurring || "No",
      attendees: Array.isArray(meeting.attendees) ? meeting.attendees.map(a => typeof a === 'object' ? (a._id || a.id) : a) : [],
      link: meeting.link || "",
    });
  };

  
  useEffect(() => {
    if (companyCode) {
      fetchMeetings();
      fetchClients();
      fetchClientMeetings();
    }
  }, [companyCode]);

  
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  
  const getUserId = (user) => {
    if (!user) return "";
    if (typeof user !== "object") return user.toString();

    const rawId = user._id || user.id || user.userId || user.user?._id || user.user?.id;
    if (!rawId) return "";

    if (typeof rawId === "object") {
      return getUserId(rawId);
    }

    return rawId.toString();
  };

  const normalizeAttendeeIds = (attendees = []) => (
    [...new Set(attendees.map(getUserId).filter(Boolean))]
  );

  const startInternalMeetingCall = (meeting) => {
    const attendees = normalizeAttendeeIds(Array.isArray(meeting.attendees) ? meeting.attendees : []);
    if (attendees.length === 0) {
      toast.warning("Please add attendees before starting a video meeting");
      return;
    }

    startCall("video", {
      _id: meeting._id,
      isGroup: true,
      name: meeting.title || "Meeting",
      title: meeting.title || "Meeting",
      attendees,
    });
  };

  
  const handleAttendeeChange = (id) => {
    setForm((prev) => ({
      ...prev,
      attendees: prev.attendees.includes(id)
        ? prev.attendees.filter((a) => a !== id)
        : [...prev.attendees, id],
    }));
  };
  
  const selectAllAttendees = () => {
    const allUserIds = users.map(user => getUserId(user));
    setForm(prev => ({
      ...prev,
      attendees: prev.attendees.length === allUserIds.length ? [] : allUserIds
    }));
  };

  const getClientId = (client) => client._id || client.id;

  const handleClientFormChange = (e) => {
    const { name, value } = e.target;
    setClientForm(prev => {
      if (name !== "clientId") return { ...prev, [name]: value };

      const selectedClient = clients.find(client => getClientId(client) === value);
      const nextAttendees = value && !prev.attendees.includes(value) ? [value, ...prev.attendees] : prev.attendees;
      return {
        ...prev,
        clientId: value,
        attendees: nextAttendees,
        location: prev.location || selectedClient?.address || "",
      };
    });
  };

  const handleClientAttendeeChange = (id) => {
    setClientForm(prev => ({
      ...prev,
      clientId: prev.clientId || id,
      attendees: prev.attendees.includes(id)
        ? prev.attendees.filter(attendeeId => attendeeId !== id)
        : [...prev.attendees, id],
    }));
  };

  const selectAllClientAttendees = () => {
    const allClientIds = clients.map(client => getClientId(client));
    setClientForm(prev => ({
      ...prev,
      attendees: prev.attendees.length === allClientIds.length ? [] : allClientIds,
      clientId: prev.clientId || allClientIds[0] || "",
    }));
  };

  const addClientMeetingDate = () => {
    if (!currentClientDateInput) return;
    if (clientForm.dates.includes(currentClientDateInput)) {
      toast.warning("Date already added");
      return;
    }
    setClientForm(prev => ({
      ...prev,
      dates: [...prev.dates, currentClientDateInput]
    }));
    setCurrentClientDateInput("");
  };

  const removeClientMeetingDate = (dateToRemove) => {
    setClientForm(prev => ({
      ...prev,
      dates: prev.dates.filter(date => date !== dateToRemove)
    }));
  };

  const resetClientForm = () => {
    setClientForm({
      title: "",
      description: "",
      meetingDate: "",
      dates: [],
      meetingTime: "",
      recurring: "No",
      clientId: "",
      attendees: [],
      meetingType: "Online",
      priority: "Normal",
      location: "",
      link: "",
      duration: "30",
      followUpRequired: "No",
    });
    setCurrentClientDateInput("");
  };

  
  const createMeeting = async (e) => {
    e.preventDefault();
    const finalDates = form.dates.length > 0 ? form.dates : (form.date ? [form.date] : []);
    if (!form.title || finalDates.length === 0 || !form.time || form.attendees.length === 0) {
      toast.warning("⚠️ Please fill all fields and select attendees");
      return;
    }

    setLoading(true);
    try {
      const currentCompanyCode = companyCode || localStorage.getItem("companyCode") || "CAREER";
      
      const payload = { 
        title: form.title,
        description: form.description,
        date: finalDates[0],
        dates: finalDates,
        time: form.time,
        recurring: form.recurring,
        attendees: form.attendees,
        link: form.link,
        createdBy: adminId,
        companyCode: currentCompanyCode,
        company: currentCompanyCode,
        companyName: users.length > 0 ? users[0].companyName : "CAREER INFOWIS IT SOLUTION PRIVATE LIMITED"
      };
      
      void 0;
      
      const res = await axios.post(`${API_URL}/meetings/create`, payload);
      if (res.data.success) {
        toast.success("✅ Meeting(s) scheduled successfully!");
        
        
        if (socket && typeof socket.emit === 'function') {
          socket.emit("meeting-created", {
            meetingId: res.data.meeting?._id,
            title: form.title,
            date: finalDates[0],
            time: form.time,
            companyCode: currentCompanyCode
          });
        } else if (socket && typeof socket.emit === 'undefined') {
          void 0;
          
          const socketInstance = socket.socket || socket;
          if (socketInstance && typeof socketInstance.emit === 'function') {
            socketInstance.emit("meeting-created", {
              meetingId: res.data.meeting?._id,
              title: form.title,
              date: finalDates[0],
              time: form.time,
              companyCode: currentCompanyCode
            });
          }
        }
        
        setForm({
          title: "",
          description: "",
          date: "",
          dates: [],
          time: "",
          recurring: "No",
          attendees: [],
          link: "",
        });
        setCurrentDateInput("");
        fetchMeetings();
        setActiveTab("manage");
      } else {
        toast.error(res.data.message || "❌ Failed to create meeting");
      }
    } catch (err) {
      console.error("Create meeting error:", err);
      toast.error(err.response?.data?.message || "❌ Failed to create meeting");
    } finally {
      setLoading(false);
    }
  };

  const createClientMeeting = async (e) => {
    e.preventDefault();
    const pendingDate = currentClientDateInput || clientForm.meetingDate;
    const finalDates = clientForm.dates.length > 0
      ? clientForm.dates
      : (pendingDate ? [pendingDate] : []);

    if (!clientForm.title || !clientForm.clientId || finalDates.length === 0 || !clientForm.meetingTime || clientForm.attendees.length === 0) {
      toast.warning("Please fill all fields and select client attendees");
      return;
    }

    setLoading(true);
    try {
      const currentCompanyCode = companyCode || localStorage.getItem("companyCode") || "CAREER";
      const payload = {
        ...clientForm,
        meetingDate: finalDates[0],
        dates: finalDates,
        companyCode: currentCompanyCode,
        createdBy: adminId,
      };

      const res = await axios.post(`${API_URL}/cmeeting/create`, payload);
      if (res.data?.success) {
        toast.success("Client meeting scheduled successfully!");
        if (socket && typeof socket.emit === 'function') {
          socket.emit("client-meeting-created", {
            meetingId: res.data.meeting?._id,
            title: clientForm.title,
            date: finalDates[0],
            time: clientForm.meetingTime,
            companyCode: currentCompanyCode
          });
        }
        resetClientForm();
        fetchClientMeetings();
        setActiveTab("manage");
      } else {
        toast.error(res.data?.message || res.data?.error || "Failed to create client meeting");
      }
    } catch (err) {
      console.error("Create client meeting error:", err);
      toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to create client meeting");
    } finally {
      setLoading(false);
    }
  };

  
  const handleUpdateMeeting = async (e) => {
    e.preventDefault();
    if (!editingMeeting.title || !editingMeeting.date || !editingMeeting.time || editingMeeting.attendees.length === 0) {
      toast.warning("⚠️ Please fill all required fields and select attendees");
      return;
    }

    setLoading(true);
    try {
      const currentCompanyCode = companyCode || localStorage.getItem("companyCode") || "CAREER";
      
      const payload = {
        title: editingMeeting.title,
        description: editingMeeting.description,
        date: editingMeeting.date,
        time: editingMeeting.time,
        recurring: editingMeeting.recurring,
        attendees: editingMeeting.attendees,
        link: editingMeeting.link,
        companyCode: currentCompanyCode,
      };

      void 0;

      const res = await axios.put(`${API_URL}/meetings/${editingMeeting._id}`, payload);
      if (res.data.success) {
        toast.success("✅ Meeting updated successfully!");
        
        if (socket && typeof socket.emit === 'function') {
          socket.emit("meeting-updated", {
            meetingId: editingMeeting._id,
            title: editingMeeting.title,
            date: editingMeeting.date,
            time: editingMeeting.time,
            companyCode: currentCompanyCode
          });
        }

        setEditingMeeting(null);
        fetchMeetings();
      } else {
        toast.error(res.data.message || "❌ Failed to update meeting");
      }
    } catch (err) {
      console.error("Update meeting error:", err);
      toast.error(err.response?.data?.message || "❌ Failed to update meeting");
    } finally {
      setLoading(false);
    }
  };

  const startEditingClientMeeting = (meeting) => {
    setEditingClientMeeting({
      _id: meeting._id,
      title: meeting.title || meeting.clientName || "",
      description: meeting.description || "",
      meetingDate: meeting.meetingDate ? new Date(meeting.meetingDate).toISOString().split('T')[0] : "",
      meetingTime: meeting.meetingTime || "",
      recurring: meeting.recurring || "No",
      clientId: (meeting.clientId?._id || meeting.clientId || "").toString(),
      attendees: Array.isArray(meeting.attendees)
        ? meeting.attendees.map(attendee => (attendee?._id || attendee?.id || attendee).toString())
        : [],
      meetingType: meeting.meetingType || "Online",
      priority: meeting.priority || "Normal",
      location: meeting.location || "",
      link: meeting.link || "",
      duration: meeting.duration || "30",
      followUpRequired: meeting.followUpRequired || "No",
      status: meeting.status || "Scheduled",
    });
  };

  const handleUpdateClientMeeting = async (e) => {
    e.preventDefault();
    if (!editingClientMeeting.title || !editingClientMeeting.clientId || !editingClientMeeting.meetingDate || !editingClientMeeting.meetingTime || editingClientMeeting.attendees.length === 0) {
      toast.warning("Please fill all required fields and select client attendees");
      return;
    }

    setLoading(true);
    try {
      const currentCompanyCode = companyCode || localStorage.getItem("companyCode") || "CAREER";
      const payload = {
        ...editingClientMeeting,
        companyCode: currentCompanyCode,
      };

      const res = await axios.put(`${API_URL}/cmeeting/${editingClientMeeting._id}`, payload);
      if (res.data?.success) {
        toast.success("Client meeting updated successfully!");
        if (socket && typeof socket.emit === 'function') {
          socket.emit("client-meeting-updated", {
            meetingId: editingClientMeeting._id,
            title: editingClientMeeting.title,
            date: editingClientMeeting.meetingDate,
            time: editingClientMeeting.meetingTime,
            companyCode: currentCompanyCode
          });
        }
        setEditingClientMeeting(null);
        fetchClientMeetings();
      } else {
        toast.error(res.data?.message || res.data?.error || "Failed to update client meeting");
      }
    } catch (err) {
      console.error("Update client meeting error:", err);
      toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to update client meeting");
    } finally {
      setLoading(false);
    }
  };

  
  const showStatus = async (meetingId, meetingTitle) => {
    try {
      const res = await axios.get(`${API_URL}/meetings/view-status/${meetingId}`);
      setStatusModal({
        open: true,
        data: res.data || [],
        meetingTitle: meetingTitle || "Meeting"
      });
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to load meeting status");
    }
  };

  const showClientStatus = async (meetingId, meetingTitle) => {
    try {
      const res = await axios.get(`${API_URL}/cmeeting/view-status/${meetingId}`);
      setStatusModal({
        open: true,
        data: res.data || [],
        meetingTitle: meetingTitle || "Client Meeting"
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load client meeting status");
    }
  };

  
  const testDeleteEndpoints = async (meetingId) => {
    const currentCompanyCode = companyCode || localStorage.getItem("companyCode") || "CAREER";
    
    const endpoints = [
      { method: 'delete', url: `${API_URL}/task/${meetingId}`, name: 'Task endpoint' },
      { method: 'delete', url: `${API_URL}/meetings/${meetingId}`, name: 'Meetings direct' },
      { method: 'post', url: `${API_URL}/meetings/delete`, data: { meetingId, companyCode: currentCompanyCode }, name: 'Meetings delete post' },
      { method: 'delete', url: `${API_URL}/meetings/delete/${meetingId}`, name: 'Meetings delete with ID' },
      { method: 'put', url: `${API_URL}/meetings/${meetingId}`, data: { status: 'deleted', companyCode: currentCompanyCode }, name: 'Meetings update status' },
      { method: 'delete', url: `${API_URL}/api/task/${meetingId}`, name: 'API task endpoint' },
      { method: 'delete', url: `${API_URL}/tasks/${meetingId}`, name: 'Tasks endpoint' },
    ];

    setDebugInfo({ show: true, message: "Testing endpoints...\n" });
    
    for (const endpoint of endpoints) {
      try {
        setDebugInfo(prev => ({ 
          ...prev, 
          message: prev.message + `\nTrying: ${endpoint.method.toUpperCase()} ${endpoint.url}` 
        }));
        
        let response;
        if (endpoint.method === 'delete') {
          response = await axios.delete(endpoint.url);
        } else if (endpoint.method === 'post') {
          response = await axios.post(endpoint.url, endpoint.data);
        } else if (endpoint.method === 'put') {
          response = await axios.put(endpoint.url, endpoint.data);
        }
        
        setDebugInfo(prev => ({ 
          ...prev, 
          message: prev.message + `\n✅ SUCCESS! Status: ${response.status}` 
        }));
        
        setMeetings(prevMeetings => 
          prevMeetings.filter(m => (m._id || m.id) !== meetingId)
        );
        
        toast.success(`✅ Meeting deleted via ${endpoint.name}`);
        return true;
      } catch (err) {
        setDebugInfo(prev => ({ 
          ...prev, 
          message: prev.message + `\n❌ Failed: ${err.response?.status || err.message}` 
        }));
      }
    }
    
    setDebugInfo(prev => ({ 
      ...prev, 
      message: prev.message + `\n\n❌ All endpoints failed. Please check API documentation.` 
    }));
    
    return false;
  };

  
  const deleteMeeting = async () => {
    if (!deleteConfirm.meetingId) return;
    
    setDeleteLoading(true);
    try {
      const isClientMeeting = deleteConfirm.module === "client";
      const response = await axios.delete(`${API_URL}/${isClientMeeting ? "cmeeting" : "meetings"}/${deleteConfirm.meetingId}`);
      
      if (response.status === 200) {
        if (socket && typeof socket.emit === 'function') {
          socket.emit(isClientMeeting ? "client-meeting-deleted" : "meeting-deleted", {
            meetingId: deleteConfirm.meetingId,
            title: deleteConfirm.meetingTitle
          });
        }
        
        if (isClientMeeting) {
          setClientMeetings(prevMeetings => 
            prevMeetings.filter(m => (m._id || m.id) !== deleteConfirm.meetingId)
          );
        } else {
          setMeetings(prevMeetings => 
            prevMeetings.filter(m => (m._id || m.id) !== deleteConfirm.meetingId)
          );
        }
        toast.success("✅ Meeting deleted successfully!");
        setDeleteConfirm({ open: false, meetingId: null, meetingTitle: "" });
      }
    } catch (err) {
      console.error("Delete error:", err);
      
      if (err.response?.status === 404) {
        toast.warning(
          <div>
            <p>Endpoint not found. Would you like to:</p>
            <button 
              onClick={() => {
                testDeleteEndpoints(deleteConfirm.meetingId);
                setDeleteConfirm({ open: false, meetingId: null, meetingTitle: "" });
              }}
              className="toast-button"
            >
              Test All Endpoints
            </button>
            <button 
              onClick={() => {
                setMeetings(prevMeetings => 
                  prevMeetings.filter(m => (m._id || m.id) !== deleteConfirm.meetingId)
                );
                toast.info("Meeting removed from UI only");
                setDeleteConfirm({ open: false, meetingId: null, meetingTitle: "" });
              }}
              className="toast-button"
            >
              Remove from UI Only
            </button>
          </div>,
          { autoClose: false }
        );
      } else {
        toast.error(err.response?.data?.message || "❌ Failed to delete meeting");
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  
  const formatDateTime = (date, time) => {
    if (!date) return { date: "N/A", time: "N/A", isPast: false, isToday: false };
    
    const meetingDate = new Date(date);
    const now = new Date();
    const isToday = meetingDate.toDateString() === now.toDateString();
    const isPast = meetingDate < now;
    const isTomorrow = meetingDate.getTime() - now.getTime() < 86400000 && meetingDate > now;

    return {
      date: isToday ? "Today" : isTomorrow ? "Tomorrow" : meetingDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: time ? new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }) : "N/A",
      isPast,
      isToday,
      isTomorrow
    };
  };

  return (
    <div className="amp-container">
      
      <div className="amp-socket-indicator" style={{
        position: 'fixed',
        top: '10px',
        right: '120px',
        background: isConnected ? '#10b981' : '#ef4444',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: '600',
        zIndex: 1000,
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        {isConnected ? '🔌 Live' : '📡 Connecting...'}
      </div>

      
      {companyCode && (
        <div className="amp-company-indicator" style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '600',
          zIndex: 1000,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          Company: {companyCode}
        </div>
      )}

      
      {debugInfo.show && (
        <div className="amp-modal-overlay" onClick={() => setDebugInfo({ show: false, message: "" })}>
          <div className="amp-modal amp-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="amp-modal-header">
              <div className="amp-modal-title-wrapper">
                <span className="amp-modal-icon">🔍</span>
                <h3 className="amp-modal-title">API Debug Information</h3>
              </div>
              <button 
                onClick={() => setDebugInfo({ show: false, message: "" })}
                className="amp-modal-close"
              >
                ✕
              </button>
            </div>
            
            <div className="amp-modal-content">
              <pre style={{ 
                background: '#1e1e2e', 
                color: '#fff', 
                padding: '20px', 
                borderRadius: '8px',
                overflow: 'auto',
                maxHeight: '400px',
                fontFamily: 'monospace',
                fontSize: '14px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {debugInfo.message}
              </pre>
            </div>

            <div className="amp-modal-footer">
              <button 
                onClick={() => setDebugInfo({ show: false, message: "" })}
                className="amp-btn amp-btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      
      <div className="amp-header">
        <div className="amp-header-content">
          <div className="amp-header-left">
            <div className="amp-header-icon">📅</div>
            <div>
              <h1 className="amp-header-title">Meeting Management</h1>
              <p className="amp-header-subtitle">Create and manage employee and client meetings efficiently</p>
              {companyCode && (
                <p className="amp-company-badge" style={{
                  marginTop: '4px',
                  fontSize: '14px',
                  color: '#667eea',
                  fontWeight: '500'
                }}>
                  Company: {companyCode}
                </p>
              )}
            </div>
          </div>
          <div className="amp-stats">
            <div className="amp-stat-item">
              <span className="amp-stat-value">{meetingAudience === "employee" ? meetings.length : clientMeetings.length}</span>
              <span className="amp-stat-label">Total Meetings</span>
            </div>
            <div className="amp-stat-item">
              <span className="amp-stat-value">{meetingAudience === "employee" ? users.length : clients.length}</span>
              <span className="amp-stat-label">{meetingAudience === "employee" ? "Team Members" : "Clients"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="amp-tabs-container amp-audience-tabs-container">
        <div className="amp-tabs">
          <button
            className={`amp-tab ${meetingAudience === "employee" ? "amp-tab-active" : ""}`}
            onClick={() => {
              setMeetingAudience("employee");
              setActiveTab("create");
            }}
          >
            <span>Employee Meetings</span>
            {meetings.length > 0 && <span className="amp-tab-badge">{meetings.length}</span>}
          </button>
          <button
            className={`amp-tab ${meetingAudience === "client" ? "amp-tab-active" : ""}`}
            onClick={() => {
              setMeetingAudience("client");
              setActiveTab("create");
            }}
          >
            <span>Client Meetings</span>
            {clientMeetings.length > 0 && <span className="amp-tab-badge">{clientMeetings.length}</span>}
          </button>
        </div>
      </div>

      
      <div className="amp-tabs-container">
        <div className="amp-tabs">
          <button 
            className={`amp-tab ${activeTab === "create" ? "amp-tab-active" : ""}`}
            onClick={() => setActiveTab("create")}
          >
            <span className="amp-tab-icon">➕</span>
            <span>{meetingAudience === "employee" ? "Create Employee Meeting" : "Create Client Meeting"}</span>
          </button>
          <button 
            className={`amp-tab ${activeTab === "manage" ? "amp-tab-active" : ""}`}
            onClick={() => setActiveTab("manage")}
          >
            <span className="amp-tab-icon">📋</span>
            <span>{meetingAudience === "employee" ? "Manage Employee Meetings" : "Manage Client Meetings"}</span>
            {(meetingAudience === "employee" ? meetings.length : clientMeetings.length) > 0 && (
              <span className="amp-tab-badge">{meetingAudience === "employee" ? meetings.length : clientMeetings.length}</span>
            )}
          </button>
        </div>
      </div>

      
      {activeTab === "create" && meetingAudience === "employee" && (
        <div className="amp-create-section">
          <div className="amp-form-card">
            <div className="amp-form-header">
              <div className="amp-form-title-wrapper">
                <div className="amp-form-icon">📅</div>
                <h2 className="amp-form-title">Create New Meeting</h2>
              </div>
              <p className="amp-form-subtitle">Fill in the details to schedule a meeting</p>
            </div>

            <form onSubmit={createMeeting} className="amp-form">
              <div className="amp-form-grid">
                
                <div className="amp-form-left">
                  <div className="amp-form-group">
                    <label className="amp-label amp-required">Meeting Title</label>
                    <input
                      type="text"
                      name="title"
                      placeholder="e.g., Weekly Team Sync"
                      value={form.title}
                      onChange={handleChange}
                      className="amp-input"
                      required
                    />
                  </div>

                  <div className="amp-form-group">
                    <label className="amp-label">Description</label>
                    <textarea
                      name="description"
                      placeholder="Meeting agenda, goals, etc..."
                      value={form.description}
                      onChange={handleChange}
                      className="amp-textarea"
                      rows="4"
                    />
                  </div>

                  <div className="amp-form-row">
                    <div className="amp-form-group">
                      <label className="amp-label amp-required">Date(s)</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div className="amp-input-icon-wrapper" style={{ flex: 1 }}>
                          <span className="amp-input-icon">📅</span>
                          <input
                            type="date"
                            value={currentDateInput}
                            onChange={(e) => setCurrentDateInput(e.target.value)}
                            className="amp-input amp-input-with-icon"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={addMeetingDate}
                          className="amp-btn amp-btn-primary"
                          style={{ padding: '0px 16px', height: '42px', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          +
                        </button>
                      </div>
                      
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                        {form.dates.map(d => (
                          <span key={d} style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)', padding: '4px 10px', borderRadius: '20px', color: '#fff', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {new Date(d).toLocaleDateString()}
                            <button type="button" onClick={() => removeMeetingDate(d)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0px', fontWeight: 'bold' }}>✕</button>
                          </span>
                        ))}
                      </div>
                      
                      
                      {form.dates.length === 0 && (
                        <div className="amp-input-icon-wrapper" style={{ marginTop: '10px' }}>
                          <span className="amp-input-icon">📅</span>
                          <input
                            type="date"
                            name="date"
                            value={form.date}
                            onChange={handleChange}
                            className="amp-input amp-input-with-icon"
                            min={new Date().toISOString().split('T')[0]}
                            required
                          />
                        </div>
                      )}
                    </div>

                    <div className="amp-form-group">
                      <label className="amp-label amp-required">Time</label>
                      <div className="amp-input-icon-wrapper">
                        <span className="amp-input-icon">⏰</span>
                        <input
                          type="time"
                          name="time"
                          value={form.time}
                          onChange={handleChange}
                          className="amp-input amp-input-with-icon"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="amp-form-group">
                    <label className="amp-label">Recurrence</label>
                    <div className="amp-select-wrapper">
                      <select
                        name="recurring"
                        value={form.recurring}
                        onChange={handleChange}
                        className="amp-select"
                      >
                        <option value="No">No Recurrence</option>
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                      </select>
                    </div>
                  </div>

                  <div className="amp-form-group" style={{ marginTop: '15px' }}>
                    <label className="amp-label">Meeting Join Link (e.g. Google Meet, Zoom)</label>
                    <div className="amp-input-icon-wrapper">
                      <span className="amp-input-icon">🔗</span>
                      <input
                        type="url"
                        name="link"
                        placeholder="https://meet.google.com/abc-defg-hij"
                        value={form.link}
                        onChange={handleChange}
                        className="amp-input amp-input-with-icon"
                      />
                    </div>
                  </div>
                </div>

                
                <div className="amp-form-right">
                  <div className="amp-attendees-header">
                    <div className="amp-attendees-title-wrapper">
                      <label className="amp-label amp-required">Select Attendees</label>
                      <span className="amp-attendees-count">
                        {form.attendees.length} / {users.length} selected
                      </span>
                    </div>
                    <button 
                      type="button" 
                      onClick={selectAllAttendees}
                      className="amp-select-all-btn"
                      disabled={!users.length}
                    >
                      {form.attendees.length === users.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>

                  
                  {groups.length > 0 && (
                    <div className="amp-groups-select-section" style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px' }}>
                      <label className="amp-label" style={{ marginBottom: '8px', display: 'block', fontWeight: '600', fontSize: '13px' }}>👥 Select by Group</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {groups.map(group => {
                          const allMembersSelected = group.members && group.members.length > 0 && group.members.every(m => {
                            const id = typeof m === 'object' ? (m._id || m.id) : m;
                            return form.attendees.includes(id.toString());
                          });
                          
                          return (
                            <button
                              key={group._id}
                              type="button"
                              onClick={() => toggleGroupSelection(group)}
                              className="amp-btn"
                              style={{
                                padding: '6px 12px',
                                fontSize: '11px',
                                borderRadius: '20px',
                                background: allMembersSelected ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)',
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s'
                              }}
                            >
                              <span>{group.name}</span>
                              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '1px 5px', borderRadius: '10px', fontSize: '9px' }}>
                                {group.members?.length || 0}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="amp-attendees-grid-container">
                    {users.length > 0 ? (
                      <div className="amp-attendees-grid">
                        {users.map((u) => {
                          const userId = getUserId(u);
                          const isSelected = form.attendees.includes(userId);
                          return (
                            <label 
                              key={userId} 
                              className={`amp-attendee-card ${isSelected ? 'amp-attendee-selected' : ''}`}
                            >
                              <input
                                type="checkbox"
                                onChange={() => handleAttendeeChange(userId)}
                                checked={isSelected}
                                className="amp-attendee-checkbox"
                              />
                              <div className="amp-attendee-avatar">
                                {u.name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div className="amp-attendee-info">
                                <span className="amp-attendee-name">{u.name || "Unknown User"}</span>
                                <span className="amp-attendee-email">{u.email || "No email"}</span>
                              </div>
                              {isSelected && (
                                <span className="amp-attendee-check">✓</span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="amp-no-users">
                        <div className="amp-no-users-icon">👥</div>
                        <p>No users available</p>
                        <span>Please check your connection</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              
              <div className="amp-form-actions">
                <button 
                  type="button"
                  className="amp-btn amp-btn-secondary"
                  onClick={() => {
                    setForm({
                      title: "",
                      description: "",
                      date: "",
                      time: "",
                      recurring: "No",
                      attendees: [],
                    });
                  }}
                >
                  Clear Form
                </button>
                <button 
                  type="submit" 
                  disabled={loading || !users.length} 
                  className="amp-btn amp-btn-primary"
                >
                  {loading ? (
                    <>
                      <span className="amp-spinner"></span>
                      Creating Meeting...
                    </>
                  ) : (
                    <>
                      <span>📅</span>
                      Create Meeting
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === "create" && meetingAudience === "client" && (
        <div className="amp-create-section">
          <div className="amp-form-card">
            <div className="amp-form-header">
              <div className="amp-form-title-wrapper">
                <div className="amp-form-icon">🤝</div>
                <h2 className="amp-form-title">Create Client Meeting</h2>
              </div>
              <p className="amp-form-subtitle">Schedule Google Meet, Zoom, or offline meetings for company clients</p>
            </div>

            <form onSubmit={createClientMeeting} className="amp-form">
              <div className="amp-form-grid">
                <div className="amp-form-left">
                  <div className="amp-form-group">
                    <label className="amp-label amp-required">Meeting Title</label>
                    <input
                      type="text"
                      name="title"
                      placeholder="e.g., Monthly Client Review"
                      value={clientForm.title}
                      onChange={handleClientFormChange}
                      className="amp-input"
                      required
                    />
                  </div>

                  <div className="amp-form-group">
                    <label className="amp-label amp-required">Primary Client</label>
                    <select
                      name="clientId"
                      value={clientForm.clientId}
                      onChange={handleClientFormChange}
                      className="amp-select"
                      required
                    >
                      <option value="">Select client</option>
                      {clients.map(client => (
                        <option key={getClientId(client)} value={getClientId(client)}>
                          {client.client} - {client.company}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="amp-form-group">
                    <label className="amp-label">Description / Agenda</label>
                    <textarea
                      name="description"
                      placeholder="Meeting agenda, goals, discussion points..."
                      value={clientForm.description}
                      onChange={handleClientFormChange}
                      className="amp-textarea"
                      rows="4"
                    />
                  </div>

                  <div className="amp-form-row">
                    <div className="amp-form-group">
                      <label className="amp-label amp-required">Date(s)</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div className="amp-input-icon-wrapper" style={{ flex: 1 }}>
                          <input
                            type="date"
                            value={currentClientDateInput}
                            onChange={(e) => {
                              setCurrentClientDateInput(e.target.value);
                              setClientForm(prev => ({ ...prev, meetingDate: e.target.value }));
                            }}
                            className="amp-input"
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <button type="button" onClick={addClientMeetingDate} className="amp-btn amp-btn-secondary">
                          Add
                        </button>
                      </div>
                      <div className="amp-selected-dates" style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {clientForm.dates.map(date => (
                          <span key={date} className="amp-badge amp-badge-upcoming" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {new Date(date).toLocaleDateString()}
                            <button type="button" onClick={() => removeClientMeetingDate(date)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>x</button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="amp-form-group">
                      <label className="amp-label amp-required">Time</label>
                      <input
                        type="time"
                        name="meetingTime"
                        value={clientForm.meetingTime}
                        onChange={handleClientFormChange}
                        className="amp-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="amp-form-row">
                    <div className="amp-form-group">
                      <label className="amp-label">Meeting Type</label>
                      <select name="meetingType" value={clientForm.meetingType} onChange={handleClientFormChange} className="amp-select">
                        <option value="Online">Online</option>
                        <option value="Demo">Demo</option>
                        <option value="Discussion">Discussion</option>
                        <option value="Sales">Sales</option>
                        <option value="Review">Review</option>
                        <option value="Support">Support</option>
                        <option value="Onboarding">Onboarding</option>
                      </select>
                    </div>
                    <div className="amp-form-group">
                      <label className="amp-label">Priority</label>
                      <select name="priority" value={clientForm.priority} onChange={handleClientFormChange} className="amp-select">
                        <option value="Low">Low</option>
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>

                  <div className="amp-form-group">
                    <label className="amp-label">Meeting Join Link (Google Meet / Zoom)</label>
                    <input
                      type="url"
                      name="link"
                      placeholder="https://meet.google.com/abc-defg-hij"
                      value={clientForm.link}
                      onChange={handleClientFormChange}
                      className="amp-input"
                    />
                  </div>

                  <div className="amp-form-group">
                    <label className="amp-label">Location / Platform</label>
                    <input
                      type="text"
                      name="location"
                      placeholder="Google Meet, Zoom, Teams, or office address"
                      value={clientForm.location}
                      onChange={handleClientFormChange}
                      className="amp-input"
                    />
                  </div>
                </div>

                <div className="amp-form-right">
                  <div className="amp-attendees-section">
                    <div className="amp-attendees-header">
                      <label className="amp-label amp-required">Client Attendees</label>
                      <div className="amp-attendees-actions">
                        <button type="button" onClick={selectAllClientAttendees} className="amp-select-all-btn">
                          {clientForm.attendees.length === clients.length ? 'Deselect All' : 'Select All'}
                        </button>
                        <span className="amp-attendees-count">{clientForm.attendees.length} selected</span>
                      </div>
                    </div>

                    <div className="amp-attendees-grid amp-client-attendees-scroll">
                      {clients.length > 0 ? clients.map(client => {
                        const clientId = getClientId(client);
                        const isSelected = clientForm.attendees.includes(clientId);
                        return (
                          <label key={clientId} className={`amp-attendee-card ${isSelected ? 'amp-attendee-selected' : ''}`}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleClientAttendeeChange(clientId)}
                              className="amp-attendee-checkbox"
                            />
                            <div className="amp-attendee-avatar">{client.client?.charAt(0).toUpperCase() || 'C'}</div>
                            <div className="amp-attendee-info">
                              <span className="amp-attendee-name">{client.client}</span>
                              <span className="amp-attendee-email">{client.email || client.company || "No email"}</span>
                            </div>
                          </label>
                        );
                      }) : (
                        <div className="amp-empty-attendees">
                          <p>No clients available for {companyCode}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="amp-form-actions">
                <button type="button" onClick={resetClientForm} className="amp-btn amp-btn-secondary" disabled={loading}>
                  Reset
                </button>
                <button type="submit" className="amp-btn amp-btn-primary" disabled={loading || clients.length === 0}>
                  {loading ? (
                    <>
                      <span className="amp-spinner"></span>
                      Creating...
                    </>
                  ) : (
                    'Create Client Meeting'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {activeTab === "manage" && meetingAudience === "employee" && (
        <div className="amp-manage-section">
          <div className="amp-manage-header">
            <div className="amp-manage-title-wrapper">
              <h2 className="amp-manage-title">All Meetings</h2>
              <p className="amp-manage-subtitle">
                {meetings.length} {meetings.length === 1 ? 'meeting' : 'meetings'} scheduled for {companyCode}
              </p>
            </div>
            <div className="amp-manage-actions">
              <button 
                onClick={fetchMeetings} 
                disabled={refreshing}
                className="amp-refresh-btn"
              >
                <span className={`amp-refresh-icon ${refreshing ? 'amp-spin' : ''}`}>🔄</span>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {!meetings.length ? (
            <div className="amp-empty-state">
              <div className="amp-empty-icon">📅</div>
              <h3 className="amp-empty-title">No Meetings Yet</h3>
              <p className="amp-empty-text">Get started by creating your first meeting for {companyCode}</p>
              <button 
                onClick={() => setActiveTab("create")}
                className="amp-btn amp-btn-primary amp-empty-btn"
              >
                <span>➕</span>
                Create Meeting
              </button>
            </div>
          ) : (
            <div className="amp-meetings-grid">
              {meetings.map((meeting) => {
                const datetime = formatDateTime(meeting.date, meeting.time);
                const attendeeCount = Array.isArray(meeting.attendees) ? meeting.attendees.length : 0;
                const meetingId = meeting._id || meeting.id;
                
                return (
                  <div key={meetingId} className="amp-meeting-card">
                    <div className="amp-meeting-status-bar" data-status={
                      datetime.isPast ? 'past' : datetime.isToday ? 'today' : 'upcoming'
                    } />
                    
                    <div className="amp-meeting-content">
                      <div className="amp-meeting-header">
                        <div className="amp-meeting-title-wrapper">
                          <span className="amp-meeting-icon">📅</span>
                          <h3 className="amp-meeting-title">{meeting.title || "Untitled Meeting"}</h3>
                        </div>
                        <div className="amp-meeting-badges">
                          {meeting.recurring && meeting.recurring !== "No" && (
                            <span className="amp-badge amp-badge-recurring">
                              🔁 {meeting.recurring}
                            </span>
                          )}
                          <span className={`amp-badge amp-badge-status ${
                            datetime.isPast ? 'amp-badge-past' : 
                            datetime.isToday ? 'amp-badge-today' : 'amp-badge-upcoming'
                          }`}>
                            {datetime.isPast ? 'Past' : datetime.isToday ? 'Today' : 'Upcoming'}
                          </span>
                          <span className="amp-badge amp-badge-company" style={{
                            background: '#f3f4f6',
                            color: '#4b5563',
                            fontSize: '11px'
                          }}>
                            {meeting.companyCode || meeting.company || 'N/A'}
                          </span>
                        </div>
                      </div>

                      {meeting.description && (
                        <p className="amp-meeting-description">{meeting.description}</p>
                      )}

                      <div className="amp-meeting-details">
                        <div className="amp-detail-item">
                          <span className="amp-detail-icon">📆</span>
                          <span className={`amp-detail-text ${
                            datetime.isPast ? 'amp-text-past' : 
                            datetime.isToday ? 'amp-text-today' : ''
                          }`}>
                            {datetime.date}
                          </span>
                        </div>
                        <div className="amp-detail-item">
                          <span className="amp-detail-icon">⏰</span>
                          <span className="amp-detail-text">{datetime.time}</span>
                        </div>
                        <div className="amp-detail-item">
                          <span className="amp-detail-icon">👥</span>
                          <span className="amp-detail-text">{attendeeCount} attendees</span>
                        </div>
                        {meeting.link && (
                          <div className="amp-detail-item">
                            <span className="amp-detail-icon">🔗</span>
                            <span className="amp-detail-text">
                              <a href={meeting.link.startsWith('http') ? meeting.link : `https://${meeting.link}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline', fontWeight: '600' }}>
                                Join Meeting
                              </a>
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="amp-meeting-footer">
                        <div className="amp-creator-info">
                          <span className="amp-creator-avatar">
                            {meeting.createdBy?.name?.charAt(0) || 'A'}
                          </span>
                          <span className="amp-creator-name">
                            {meeting.createdBy?.name || 'Admin'}
                          </span>
                        </div>
                        
                        <div className="amp-meeting-actions">
                          <button
                            onClick={() => startInternalMeetingCall(meeting)}
                            className="amp-action-btn amp-action-call"
                            title="Start Video Meeting"
                          >
                            Video
                          </button>
                          <button 
                            onClick={() => showStatus(meetingId, meeting.title)}
                            className="amp-action-btn amp-action-view"
                            title="View Attendance"
                          >
                            👁️
                          </button>
                          <button 
                            onClick={() => startEditing(meeting)}
                            className="amp-action-btn"
                            style={{ background: '#f59e0b', color: 'white', marginRight: '6px' }}
                            title="Edit Meeting"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => setDeleteConfirm({
                              open: true,
                              meetingId: meetingId,
                              meetingTitle: meeting.title
                            })}
                            className="amp-action-btn amp-action-delete"
                            title="Delete Meeting"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "manage" && meetingAudience === "client" && (
        <div className="amp-manage-section">
          <div className="amp-manage-header">
            <div className="amp-manage-title-wrapper">
              <h2 className="amp-manage-title">Client Meeting History</h2>
              <p className="amp-manage-subtitle">
                {clientMeetings.length} {clientMeetings.length === 1 ? 'meeting' : 'meetings'} scheduled for clients in {companyCode}
              </p>
            </div>
            <div className="amp-manage-actions">
              <button
                onClick={fetchClientMeetings}
                disabled={refreshing}
                className="amp-refresh-btn"
              >
                <span className={`amp-refresh-icon ${refreshing ? 'amp-spin' : ''}`}>↻</span>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {!clientMeetings.length ? (
            <div className="amp-empty-state">
              <div className="amp-empty-icon">🤝</div>
              <h3 className="amp-empty-title">No Client Meetings Yet</h3>
              <p className="amp-empty-text">Create the first client meeting for {companyCode}</p>
              <button
                onClick={() => setActiveTab("create")}
                className="amp-btn amp-btn-primary amp-empty-btn"
              >
                <span>+</span>
                Create Client Meeting
              </button>
            </div>
          ) : (
            <div className="amp-meetings-grid">
              {clientMeetings.map((meeting) => {
                const datetime = formatDateTime(meeting.meetingDate, meeting.meetingTime);
                const attendeeCount = Array.isArray(meeting.attendees) ? meeting.attendees.length : 0;
                const meetingId = meeting._id || meeting.id;

                return (
                  <div key={meetingId} className="amp-meeting-card">
                    <div className="amp-meeting-status-bar" data-status={
                      meeting.status === 'Completed' ? 'past' : datetime.isToday ? 'today' : 'upcoming'
                    } />

                    <div className="amp-meeting-content">
                      <div className="amp-meeting-header">
                        <div className="amp-meeting-title-wrapper">
                          <span className="amp-meeting-icon">🤝</span>
                          <h3 className="amp-meeting-title">{meeting.title || meeting.clientName || "Client Meeting"}</h3>
                        </div>
                        <div className="amp-meeting-badges">
                          <span className="amp-badge amp-badge-company">{meeting.meetingType || 'Online'}</span>
                          <span className={`amp-badge amp-badge-status ${
                            meeting.status === 'Completed' ? 'amp-badge-past' :
                            datetime.isToday ? 'amp-badge-today' : 'amp-badge-upcoming'
                          }`}>
                            {meeting.status || (datetime.isPast ? 'Past' : datetime.isToday ? 'Today' : 'Upcoming')}
                          </span>
                          <span className="amp-badge amp-badge-company">{meeting.priority || 'Normal'}</span>
                        </div>
                      </div>

                      {meeting.description && (
                        <p className="amp-meeting-description">{meeting.description}</p>
                      )}

                      <div className="amp-meeting-details">
                        <div className="amp-detail-item">
                          <span className="amp-detail-icon">🏢</span>
                          <span>{meeting.clientName || meeting.clientId?.client || 'Client'}</span>
                        </div>
                        <div className="amp-detail-item">
                          <span className="amp-detail-icon">📆</span>
                          <span>{datetime.date}</span>
                        </div>
                        <div className="amp-detail-item">
                          <span className="amp-detail-icon">⏰</span>
                          <span>{datetime.time}</span>
                        </div>
                        <div className="amp-detail-item">
                          <span className="amp-detail-icon">👥</span>
                          <span>{attendeeCount} client {attendeeCount === 1 ? 'attendee' : 'attendees'}</span>
                        </div>
                        {(meeting.link || meeting.location) && (
                          <div className="amp-detail-item">
                            <span className="amp-detail-icon">🔗</span>
                            {meeting.link ? (
                              <a href={meeting.link} target="_blank" rel="noopener noreferrer" className="amp-meeting-link">
                                Join Meeting
                              </a>
                            ) : (
                              <span>{meeting.location}</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="amp-meeting-footer">
                        <div className="amp-creator-info">
                          <span className="amp-creator-avatar">
                            {meeting.createdBy?.name?.charAt(0) || 'A'}
                          </span>
                          <span className="amp-creator-name">
                            {meeting.createdBy?.name || 'Admin'}
                          </span>
                        </div>

                        <div className="amp-meeting-actions">
                          <button
                            onClick={() => showClientStatus(meetingId, meeting.title || meeting.clientName)}
                            className="amp-action-btn amp-action-view"
                            title="View Attendance"
                          >
                            View
                          </button>
                          <button
                            onClick={() => startEditingClientMeeting(meeting)}
                            className="amp-action-btn"
                            style={{ background: '#f59e0b', color: 'white', marginRight: '6px' }}
                            title="Edit Client Meeting"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({
                              open: true,
                              meetingId,
                              meetingTitle: meeting.title || meeting.clientName,
                              module: "client"
                            })}
                            className="amp-action-btn amp-action-delete"
                            title="Delete Client Meeting"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      
      {statusModal.open && (
        <div className="amp-modal-overlay" onClick={() => setStatusModal({ open: false, data: [], meetingTitle: "" })}>
          <div className="amp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="amp-modal-header">
              <div className="amp-modal-title-wrapper">
                <span className="amp-modal-icon">📋</span>
                <h3 className="amp-modal-title">Attendance Status</h3>
              </div>
              <button 
                onClick={() => setStatusModal({ open: false, data: [], meetingTitle: "" })}
                className="amp-modal-close"
              >
                ✕
              </button>
            </div>
            
            <div className="amp-modal-subheader">
              <span className="amp-meeting-badge">{statusModal.meetingTitle}</span>
              <span className="amp-attendee-total">
                {statusModal.data.length} {statusModal.data.length === 1 ? 'attendee' : 'attendees'}
              </span>
            </div>

            <div className="amp-modal-content">
              {statusModal.data.length > 0 ? (
                <div className="amp-status-list">
                  <div className="amp-status-header">
                    <span>Attendee</span>
                    <span>Status</span>
                  </div>
                  {statusModal.data.map((item, index) => (
                    <div key={index} className="amp-status-item">
                      <div className="amp-status-user">
                        <div className="amp-status-avatar">
                          {item.userId?.name?.charAt(0) || item.clientId?.client?.charAt(0) || item.user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="amp-status-user-info">
                          <span className="amp-status-user-name">
                            {item.userId?.name || item.clientId?.client || item.user?.name || "Unknown Attendee"}
                          </span>
                          <span className="amp-status-user-email">
                            {item.userId?.email || item.clientId?.email || item.user?.email || "No email"}
                          </span>
                        </div>
                      </div>
                      <div className={`amp-status-badge ${item.viewed ? 'amp-status-seen' : 'amp-status-pending'}`}>
                        {item.viewed ? (
                          <>
                            <span>✅</span>
                            <span>{item.attendanceStatus || 'Seen'}</span>
                          </>
                        ) : (
                          <>
                            <span>⏳</span>
                            <span>Not Seen</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="amp-no-status">
                  <div className="amp-no-status-icon">📭</div>
                  <p>No attendance data available</p>
                  <span>No one has viewed this meeting yet</span>
                </div>
              )}
            </div>

            <div className="amp-modal-footer">
              <button 
                onClick={() => setStatusModal({ open: false, data: [], meetingTitle: "" })}
                className="amp-btn amp-btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      
      {deleteConfirm.open && (
        <div className="amp-modal-overlay" onClick={() => setDeleteConfirm({ open: false, meetingId: null, meetingTitle: "" })}>
          <div className="amp-modal amp-modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="amp-modal-header amp-modal-header-danger">
              <div className="amp-modal-title-wrapper">
                <span className="amp-modal-icon">⚠️</span>
                <h3 className="amp-modal-title">Delete Meeting</h3>
              </div>
              <button 
                onClick={() => setDeleteConfirm({ open: false, meetingId: null, meetingTitle: "" })}
                className="amp-modal-close"
              >
                ✕
              </button>
            </div>
            
            <div className="amp-modal-content amp-modal-content-center">
              <div className="amp-delete-icon">🗑️</div>
              <p className="amp-delete-text">
                Are you sure you want to delete <strong>"{deleteConfirm.meetingTitle}"</strong>?
              </p>
              <p className="amp-delete-subtext">
                Meeting ID: <code style={{background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px'}}>{deleteConfirm.meetingId}</code>
              </p>
              <p className="amp-delete-subtext">
                This action cannot be undone. All meeting data will be permanently removed.
              </p>
            </div>

            <div className="amp-modal-footer amp-modal-footer-center">
              <button 
                onClick={() => setDeleteConfirm({ open: false, meetingId: null, meetingTitle: "" })}
                className="amp-btn amp-btn-secondary"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button 
                onClick={deleteMeeting}
                className="amp-btn amp-btn-danger"
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <span className="amp-spinner"></span>
                    Deleting...
                  </>
                ) : (
                  'Delete Meeting'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      
      {editingMeeting && (
        <div className="amp-modal-overlay" onClick={() => setEditingMeeting(null)}>
          <div className="amp-modal amp-modal-lg" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="amp-modal-header">
              <div className="amp-modal-title-wrapper">
                <span className="amp-modal-icon">✏️</span>
                <h3 className="amp-modal-title">Edit Meeting</h3>
              </div>
              <button 
                onClick={() => setEditingMeeting(null)}
                className="amp-modal-close"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdateMeeting}>
              <div className="amp-modal-content" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="amp-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  
                  
                  <div>
                    <div className="amp-form-group" style={{ marginBottom: '15px' }}>
                      <label className="amp-label amp-required">Meeting Title</label>
                      <input
                        type="text"
                        value={editingMeeting.title}
                        onChange={(e) => setEditingMeeting({ ...editingMeeting, title: e.target.value })}
                        className="amp-input"
                        required
                      />
                    </div>

                    <div className="amp-form-group" style={{ marginBottom: '15px' }}>
                      <label className="amp-label">Description</label>
                      <textarea
                        value={editingMeeting.description}
                        onChange={(e) => setEditingMeeting({ ...editingMeeting, description: e.target.value })}
                        className="amp-textarea"
                        rows="3"
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                      <div className="amp-form-group">
                        <label className="amp-label amp-required">Date</label>
                        <input
                          type="date"
                          value={editingMeeting.date}
                          onChange={(e) => setEditingMeeting({ ...editingMeeting, date: e.target.value })}
                          className="amp-input"
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>

                      <div className="amp-form-group">
                        <label className="amp-label amp-required">Time</label>
                        <input
                          type="time"
                          value={editingMeeting.time}
                          onChange={(e) => setEditingMeeting({ ...editingMeeting, time: e.target.value })}
                          className="amp-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="amp-form-group" style={{ marginBottom: '15px' }}>
                      <label className="amp-label">Recurrence</label>
                      <select
                        value={editingMeeting.recurring}
                        onChange={(e) => setEditingMeeting({ ...editingMeeting, recurring: e.target.value })}
                        className="amp-select"
                      >
                        <option value="No">No Recurrence</option>
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                      </select>
                    </div>

                    <div className="amp-form-group">
                      <label className="amp-label">Meeting Join Link (e.g. Google Meet, Zoom)</label>
                      <input
                        type="url"
                        placeholder="https://meet.google.com/abc-defg-hij"
                        value={editingMeeting.link}
                        onChange={(e) => setEditingMeeting({ ...editingMeeting, link: e.target.value })}
                        className="amp-input"
                      />
                    </div>
                  </div>

                  
                  <div>
                    <div className="amp-attendees-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <label className="amp-label amp-required">Select Attendees</label>
                      <span className="amp-attendees-count" style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {editingMeeting.attendees.length} / {users.length} selected
                      </span>
                    </div>

                    
                    {groups.length > 0 && (
                      <div className="amp-groups-select-section" style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
                        <label className="amp-label" style={{ marginBottom: '6px', display: 'block', fontWeight: '600', fontSize: '12px' }}>👥 Select by Group</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {groups.map(group => {
                            const allMembersSelected = group.members && group.members.length > 0 && group.members.every(m => {
                              const id = typeof m === 'object' ? (m._id || m.id) : m;
                              return editingMeeting.attendees.includes(id.toString());
                            });
                            
                            return (
                              <button
                                key={group._id}
                                type="button"
                                onClick={() => toggleEditGroupSelection(group)}
                                className="amp-btn"
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '10px',
                                  borderRadius: '20px',
                                  background: allMembersSelected ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255,255,255,0.1)',
                                  color: '#fff',
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <span>{group.name}</span>
                                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0px 4px', borderRadius: '10px', fontSize: '8px' }}>
                                  {group.members?.length || 0}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="amp-attendees-grid-container" style={{ maxHeight: '350px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                      {users.length > 0 ? (
                        <div className="amp-attendees-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                          {users.map((u) => {
                            const userId = getUserId(u);
                            const isSelected = editingMeeting.attendees.includes(userId);
                            return (
                              <label 
                                key={userId} 
                                className={`amp-attendee-card ${isSelected ? 'amp-attendee-selected' : ''}`}
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '6px', cursor: 'pointer', background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.02)', border: isSelected ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255,255,255,0.05)' }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    setEditingMeeting(prev => {
                                      const updated = prev.attendees.includes(userId)
                                        ? prev.attendees.filter(a => a !== userId)
                                        : [...prev.attendees, userId];
                                      return { ...prev, attendees: updated };
                                    });
                                  }}
                                  className="amp-attendee-checkbox"
                                />
                                <div className="amp-attendee-avatar" style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                  {u.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="amp-attendee-info" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                  <span className="amp-attendee-name" style={{ fontSize: '13px', fontWeight: '600' }}>{u.name || "Unknown User"}</span>
                                  <span className="amp-attendee-email" style={{ fontSize: '11px', color: '#9ca3af' }}>{u.email || "No email"}</span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>No users available</p>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              <div className="amp-modal-footer">
                <button 
                  type="button"
                  onClick={() => setEditingMeeting(null)}
                  className="amp-btn amp-btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="amp-btn amp-btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingClientMeeting && (
        <div className="amp-modal-overlay" onClick={() => setEditingClientMeeting(null)}>
          <div className="amp-modal amp-modal-lg" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="amp-modal-header">
              <div className="amp-modal-title-wrapper">
                <span className="amp-modal-icon">🤝</span>
                <h3 className="amp-modal-title">Edit Client Meeting</h3>
              </div>
              <button
                onClick={() => setEditingClientMeeting(null)}
                className="amp-modal-close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateClientMeeting}>
              <div className="amp-modal-content" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="amp-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <div className="amp-form-group" style={{ marginBottom: '15px' }}>
                      <label className="amp-label amp-required">Meeting Title</label>
                      <input
                        type="text"
                        value={editingClientMeeting.title}
                        onChange={(e) => setEditingClientMeeting({ ...editingClientMeeting, title: e.target.value })}
                        className="amp-input"
                        required
                      />
                    </div>

                    <div className="amp-form-group" style={{ marginBottom: '15px' }}>
                      <label className="amp-label amp-required">Primary Client</label>
                      <select
                        value={editingClientMeeting.clientId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setEditingClientMeeting(prev => ({
                            ...prev,
                            clientId: id,
                            attendees: prev.attendees.includes(id) ? prev.attendees : [id, ...prev.attendees],
                          }));
                        }}
                        className="amp-select"
                        required
                      >
                        <option value="">Select client</option>
                        {clients.map(client => (
                          <option key={getClientId(client)} value={getClientId(client)}>
                            {client.client} - {client.company}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="amp-form-group" style={{ marginBottom: '15px' }}>
                      <label className="amp-label">Description</label>
                      <textarea
                        value={editingClientMeeting.description}
                        onChange={(e) => setEditingClientMeeting({ ...editingClientMeeting, description: e.target.value })}
                        className="amp-textarea"
                        rows="3"
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                      <div className="amp-form-group">
                        <label className="amp-label amp-required">Date</label>
                        <input
                          type="date"
                          value={editingClientMeeting.meetingDate}
                          onChange={(e) => setEditingClientMeeting({ ...editingClientMeeting, meetingDate: e.target.value })}
                          className="amp-input"
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>

                      <div className="amp-form-group">
                        <label className="amp-label amp-required">Time</label>
                        <input
                          type="time"
                          value={editingClientMeeting.meetingTime}
                          onChange={(e) => setEditingClientMeeting({ ...editingClientMeeting, meetingTime: e.target.value })}
                          className="amp-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="amp-form-group" style={{ marginBottom: '15px' }}>
                      <label className="amp-label">Meeting Link</label>
                      <input
                        type="url"
                        value={editingClientMeeting.link}
                        onChange={(e) => setEditingClientMeeting({ ...editingClientMeeting, link: e.target.value })}
                        className="amp-input"
                        placeholder="https://meet.google.com/abc-defg-hij"
                      />
                    </div>

                    <div className="amp-form-group">
                      <label className="amp-label">Location / Platform</label>
                      <input
                        type="text"
                        value={editingClientMeeting.location}
                        onChange={(e) => setEditingClientMeeting({ ...editingClientMeeting, location: e.target.value })}
                        className="amp-input"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="amp-attendees-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <label className="amp-label amp-required">Client Attendees</label>
                      <span className="amp-attendees-count" style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {editingClientMeeting.attendees.length} / {clients.length} selected
                      </span>
                    </div>

                    <div className="amp-attendees-grid-container" style={{ maxHeight: '420px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                      <div className="amp-attendees-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                        {clients.map(client => {
                          const clientId = getClientId(client);
                          const isSelected = editingClientMeeting.attendees.includes(clientId);
                          return (
                            <label
                              key={clientId}
                              className={`amp-attendee-card ${isSelected ? 'amp-attendee-selected' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  setEditingClientMeeting(prev => ({
                                    ...prev,
                                    clientId: prev.clientId || clientId,
                                    attendees: prev.attendees.includes(clientId)
                                      ? prev.attendees.filter(id => id !== clientId)
                                      : [...prev.attendees, clientId],
                                  }));
                                }}
                                className="amp-attendee-checkbox"
                              />
                              <div className="amp-attendee-avatar">
                                {client.client?.charAt(0).toUpperCase() || 'C'}
                              </div>
                              <div className="amp-attendee-info">
                                <span className="amp-attendee-name">{client.client || "Unknown Client"}</span>
                                <span className="amp-attendee-email">{client.email || client.company || "No email"}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="amp-modal-footer">
                <button
                  type="button"
                  onClick={() => setEditingClientMeeting(null)}
                  className="amp-btn amp-btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="amp-btn amp-btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
