import React, { useEffect, useMemo, useState } from "react";
import axios from "../../utils/axiosConfig";
import "./PageManagement.css";
import CIISLoader from "../../Loader/CIISLoader";

const getUserId = (user) => String(user?._id || user?.id || "");
const hasConfiguredPermission = (page) =>
  (page?.approvers || []).length > 0 || (page?.deleteUsers || []).length > 0;

const PageManagement = () => {
  const [pages, setPages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedPageKey, setSelectedPageKey] = useState("emp-leaves");
  const [selectedApprovers, setSelectedApprovers] = useState([]);
  const [selectedDeleteUsers, setSelectedDeleteUsers] = useState([]);
  const [permissionMode, setPermissionMode] = useState("approve");
  const [searchTerm, setSearchTerm] = useState("");
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const selectedPage = useMemo(
    () => pages.find((page) => page.pageKey === selectedPageKey) || pages[0],
    [pages, selectedPageKey]
  );

  const searchedPages = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return pages;

    return pages.filter((page) =>
      [page.name, page.path, page.pageKey]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [pages, searchTerm]);

  const configuredPages = useMemo(
    () => searchedPages.filter(hasConfiguredPermission),
    [searchedPages]
  );

  const unconfiguredPages = useMemo(
    () => searchedPages.filter((page) => !hasConfiguredPermission(page)),
    [searchedPages]
  );

  const activeSelectedUsers = permissionMode === "delete" ? selectedDeleteUsers : selectedApprovers;
  const activeSelectedUserSet = useMemo(
    () => new Set(activeSelectedUsers.map(String)),
    [activeSelectedUsers]
  );

  const filteredUsers = useMemo(() => {
    const query = userSearchTerm.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) =>
      [user.name, user.email, user.companyRole, user.jobRole]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [userSearchTerm, users]);

  const selectedUsers = useMemo(
    () => filteredUsers.filter((user) => activeSelectedUserSet.has(getUserId(user))),
    [activeSelectedUserSet, filteredUsers]
  );

  const availableUsers = useMemo(
    () => filteredUsers.filter((user) => !activeSelectedUserSet.has(getUserId(user))),
    [activeSelectedUserSet, filteredUsers]
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [pagesRes, usersRes] = await Promise.all([
        axios.get("/page-permissions/pages"),
        axios.get("/users/company-users")
      ]);

      const loadedPages = pagesRes.data?.pages || [];
      const loadedUsers = usersRes.data?.message?.users || usersRes.data?.users || usersRes.data?.data?.users || [];

      setPages(loadedPages);
      setUsers(loadedUsers);

      const initialPage = loadedPages.find((page) => page.pageKey === selectedPageKey) || loadedPages[0];
      if (initialPage) {
        setSelectedPageKey(initialPage.pageKey);
        setSelectedApprovers((initialPage.approvers || []).map(getUserId).filter(Boolean));
        setSelectedDeleteUsers((initialPage.deleteUsers || []).map(getUserId).filter(Boolean));
      }
    } catch (error) {
      console.error("Failed to load page management data:", error);
      setMessage({ type: "error", text: "Unable to load page management data." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectPage = (page) => {
    setSelectedPageKey(page.pageKey);
    setSelectedApprovers((page.approvers || []).map(getUserId).filter(Boolean));
    setSelectedDeleteUsers((page.deleteUsers || []).map(getUserId).filter(Boolean));
    setMessage(null);
  };

  const toggleSelectedUser = (userId) => {
    const setter = permissionMode === "delete" ? setSelectedDeleteUsers : setSelectedApprovers;
    setter((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const savePermissions = async () => {
    if (!selectedPage) return;

    setSaving(true);
    setMessage(null);
    try {
      const res = await axios.put(`/page-permissions/${selectedPage.pageKey}`, {
        approverIds: selectedApprovers,
        deleteUserIds: selectedDeleteUsers
      });

      const updatedPage = res.data?.page;
      setPages((prev) =>
        prev.map((page) =>
          page.pageKey === selectedPage.pageKey
            ? { ...page, approvers: updatedPage?.approvers || [], deleteUsers: updatedPage?.deleteUsers || [] }
            : page
        )
      );
      setMessage({ type: "success", text: "Page permissions saved successfully." });
    } catch (error) {
      console.error("Failed to save page permissions:", error);
      setMessage({ type: "error", text: error.response?.data?.error || "Unable to save page permissions." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CIISLoader />;

  return (
    <div className="PageManagement-container">
      <section className="PageManagement-header">
        <div>
          <h1>Page Management</h1>
          <p>View page URLs and select authorized users for page actions such as leave approvals.</p>
        </div>
        <button className="PageManagement-refresh" onClick={loadData} type="button">
          Refresh
        </button>
      </section>

      {message && (
        <div className={`PageManagement-alert PageManagement-alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="PageManagement-layout">
        <section className="PageManagement-pages">
          <div className="PageManagement-section-title">
            <h2>All Pages</h2>
            <span>{searchedPages.length} pages</span>
          </div>

          <input
            className="PageManagement-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search page or URL"
            type="search"
          />

          <div className="PageManagement-page-list">
            {configuredPages.length > 0 && (
              <PageGroup
                title="Configured Pages"
                pages={configuredPages}
                selectedPage={selectedPage}
                onSelectPage={selectPage}
              />
            )}
            {unconfiguredPages.length > 0 && (
              <PageGroup
                title="No Permissions Configured"
                pages={unconfiguredPages}
                selectedPage={selectedPage}
                onSelectPage={selectPage}
              />
            )}
            {!searchedPages.length && (
              <div className="PageManagement-empty">No pages found.</div>
            )}
          </div>
        </section>

        <section className="PageManagement-editor">
          <div className="PageManagement-section-title">
            <div>
              <h2>{selectedPage?.name || "Select Page"}</h2>
              <p>{selectedPage?.path}</p>
            </div>
            <button
              className="PageManagement-save"
              onClick={savePermissions}
              disabled={saving || !selectedPage}
              type="button"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>

          <div className="PageManagement-note">
            Configure who can approve/reject and who can delete records for the selected page. For `/ciisUser/emp-leaves`, all selected approvers must approve before a leave becomes Approved.
          </div>

          <div className="PageManagement-mode-tabs">
            <button
              type="button"
              className={permissionMode === "approve" ? "PageManagement-mode-active" : ""}
              onClick={() => setPermissionMode("approve")}
            >
              Approve / Reject
              <span>{selectedApprovers.length}</span>
            </button>
            <button
              type="button"
              className={permissionMode === "delete" ? "PageManagement-mode-active" : ""}
              onClick={() => setPermissionMode("delete")}
            >
              Delete
              <span>{selectedDeleteUsers.length}</span>
            </button>
          </div>

          <input
            className="PageManagement-search PageManagement-user-search"
            value={userSearchTerm}
            onChange={(event) => setUserSearchTerm(event.target.value)}
            placeholder="Search users"
            type="search"
          />

          <div className="PageManagement-user-sections">
            <UserGroup
              title={`Selected Users (${selectedUsers.length})`}
              users={selectedUsers}
              activeSelectedUserSet={activeSelectedUserSet}
              onToggleUser={toggleSelectedUser}
              emptyText="No selected users."
            />
            <UserGroup
              title={`Available Users (${availableUsers.length})`}
              users={availableUsers}
              activeSelectedUserSet={activeSelectedUserSet}
              onToggleUser={toggleSelectedUser}
              emptyText="No available users found."
            />
          </div>
        </section>
      </div>
    </div>
  );
};

const PageGroup = ({ title, pages, selectedPage, onSelectPage }) => (
  <div className="PageManagement-page-group">
    <h3>{title}</h3>
    {pages.map((page) => (
      <button
        key={page.pageKey}
        type="button"
        className={`PageManagement-page-item ${selectedPage?.pageKey === page.pageKey ? "PageManagement-page-item-active" : ""}`}
        onClick={() => onSelectPage(page)}
      >
        <span className="PageManagement-page-name">{page.name}</span>
        <span className="PageManagement-page-url">{page.path}</span>
        <span className="PageManagement-page-count">
          {(page.approvers || []).length} approver / {(page.deleteUsers || []).length} delete
        </span>
      </button>
    ))}
  </div>
);

const UserGroup = ({ title, users, activeSelectedUserSet, onToggleUser, emptyText }) => (
  <section className="PageManagement-user-group">
    <h3>{title}</h3>
    {users.length ? (
      <div className="PageManagement-users">
        {users.map((user) => {
          const userId = getUserId(user);
          const selected = activeSelectedUserSet.has(userId);
          return (
            <label className={`PageManagement-user ${selected ? "PageManagement-user-selected" : ""}`} key={userId}>
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggleUser(userId)}
              />
              <span className="PageManagement-avatar">
                {(user.name || user.email || "U").slice(0, 1).toUpperCase()}
              </span>
              <span className="PageManagement-user-main">
                <strong>{user.name || "Unnamed User"}</strong>
                <small>{user.email}</small>
              </span>
              <span className="PageManagement-role">
                {user.companyRole || user.jobRole || "User"}
              </span>
            </label>
          );
        })}
      </div>
    ) : (
      <div className="PageManagement-empty">{emptyText}</div>
    )}
  </section>
);

export default PageManagement;
