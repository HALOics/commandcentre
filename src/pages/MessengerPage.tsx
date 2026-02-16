import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { writeMessengerUnreadCount } from "../messenger/unreadState";

type ChatFilter = "all" | "groups" | "direct";
type ChatKind = "group" | "direct";

type ChatPreview = {
  id: string;
  kind: ChatKind;
  name: string;
  subtitle: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  members?: number;
};

type ChatMessage = {
  id: string;
  sender: "me" | "other";
  author: string;
  body: string;
  time: string;
};

const initialChats: ChatPreview[] = [
  {
    id: "grp-ops",
    kind: "group",
    name: "Operations Handoff",
    subtitle: "Daily shift transitions",
    lastMessage: "Please confirm tonight's staffing cover.",
    time: "09:42",
    unread: 3,
    online: true,
    members: 11
  },
  {
    id: "dir-maya",
    kind: "direct",
    name: "Maya Ellis",
    subtitle: "Clinical Lead",
    lastMessage: "Can you review the eMAR exception list?",
    time: "09:18",
    unread: 1,
    online: true
  },
  {
    id: "grp-feedback",
    kind: "group",
    name: "Service User Feedback",
    subtitle: "Support quality reviews",
    lastMessage: "New 5-star comment added from Atlas-01.",
    time: "08:56",
    unread: 5,
    online: true,
    members: 8
  },
  {
    id: "dir-jordan",
    kind: "direct",
    name: "Jordan Blake",
    subtitle: "Housing Coordinator",
    lastMessage: "Unit Cedar-2 maintenance has been booked.",
    time: "08:27",
    unread: 0,
    online: false
  },
  {
    id: "grp-rota",
    kind: "group",
    name: "Rota Coverage",
    subtitle: "Open shifts and backfill",
    lastMessage: "Night shift gap covered for tomorrow.",
    time: "07:50",
    unread: 2,
    online: true,
    members: 9
  },
  {
    id: "dir-avery",
    kind: "direct",
    name: "Avery Clark",
    subtitle: "Support Manager",
    lastMessage: "Great work on the morning response times.",
    time: "Yesterday",
    unread: 0,
    online: false
  }
];

const initialMessages: Record<string, ChatMessage[]> = {
  "grp-ops": [
    {
      id: "grp-ops-1",
      sender: "other",
      author: "Samira",
      body: "Morning all, please update handover notes before 10:00.",
      time: "09:30"
    },
    {
      id: "grp-ops-2",
      sender: "other",
      author: "Luca",
      body: "Medication confirmation is complete for Maple and Harbor units.",
      time: "09:34"
    },
    {
      id: "grp-ops-3",
      sender: "me",
      author: "You",
      body: "Acknowledged. I'll confirm the remaining rota checks in 15 mins.",
      time: "09:38"
    }
  ],
  "dir-maya": [
    {
      id: "dir-maya-1",
      sender: "other",
      author: "Maya",
      body: "Can you review the eMAR exception list before governance call?",
      time: "09:10"
    },
    {
      id: "dir-maya-2",
      sender: "me",
      author: "You",
      body: "Yes, I am reviewing now. I'll send the summary shortly.",
      time: "09:14"
    }
  ],
  "grp-feedback": [
    {
      id: "grp-feedback-1",
      sender: "other",
      author: "Nia",
      body: "New feedback: 'Staff explained each step clearly and helped me feel calm.'",
      time: "08:46"
    },
    {
      id: "grp-feedback-2",
      sender: "other",
      author: "Imran",
      body: "Average score is now 4.6/5 for the week.",
      time: "08:50"
    }
  ],
  "dir-jordan": [
    {
      id: "dir-jordan-1",
      sender: "other",
      author: "Jordan",
      body: "Unit Cedar-2 maintenance has been booked for 13:00 today.",
      time: "08:27"
    }
  ],
  "grp-rota": [
    {
      id: "grp-rota-1",
      sender: "other",
      author: "Olivia",
      body: "Night shift gap covered for tomorrow. Thanks team.",
      time: "07:50"
    }
  ],
  "dir-avery": [
    {
      id: "dir-avery-1",
      sender: "other",
      author: "Avery",
      body: "Great work on the morning response times.",
      time: "Yesterday"
    }
  ]
};

const filterOptions: Array<{ id: ChatFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "groups", label: "Groups" },
  { id: "direct", label: "Direct" }
];

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M11 4a7 7 0 105.1 11.8L20 19.7l1.4-1.4-3.8-3.8A7 7 0 0011 4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 20l18-8L3 4l3 8-3 8zm3-8h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getDirectChatIdBase(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `dir-team-${slug || "contact"}`;
}

export default function MessengerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [chatFilter, setChatFilter] = useState<ChatFilter>("all");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [chatList, setChatList] = useState<ChatPreview[]>(initialChats);
  const [messageMap, setMessageMap] = useState<Record<string, ChatMessage[]>>(initialMessages);
  const [selectedChatId, setSelectedChatId] = useState<string>(initialChats[0].id);

  const groupCount = useMemo(() => chatList.filter((chat) => chat.kind === "group").length, [chatList]);
  const directCount = useMemo(() => chatList.filter((chat) => chat.kind === "direct").length, [chatList]);
  const unreadCount = useMemo(() => chatList.reduce((total, chat) => total + chat.unread, 0), [chatList]);

  useEffect(() => {
    writeMessengerUnreadCount(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    const requestedContact = searchParams.get("contact")?.trim();
    if (!requestedContact) {
      return;
    }

    const requestedRole = searchParams.get("contactRole")?.trim() || "Team Member";
    const requestedStatus = searchParams.get("contactStatus")?.trim() || "inactive";
    const normalizedRequestedName = requestedContact.toLowerCase();

    const existingChat = chatList.find(
      (chat) => chat.kind === "direct" && chat.name.toLowerCase() === normalizedRequestedName
    );

    if (existingChat) {
      setSelectedChatId(existingChat.id);
      setChatFilter("direct");
      setQuery("");
      setSearchParams({}, { replace: true });
      return;
    }

    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const idBase = getDirectChatIdBase(requestedContact);
    let nextId = idBase;
    let suffix = 1;

    while (chatList.some((chat) => chat.id === nextId)) {
      nextId = `${idBase}-${suffix}`;
      suffix += 1;
    }

    const newChat: ChatPreview = {
      id: nextId,
      kind: "direct",
      name: requestedContact,
      subtitle: requestedRole,
      lastMessage: "Start a secure conversation.",
      time,
      unread: 0,
      online: requestedStatus === "active"
    };

    setChatList((current) => [newChat, ...current]);
    setMessageMap((current) => ({ ...current, [nextId]: current[nextId] ?? [] }));
    setSelectedChatId(nextId);
    setChatFilter("direct");
    setQuery("");
    setSearchParams({}, { replace: true });
  }, [chatList, searchParams, setSearchParams]);

  const filteredChats = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return chatList.filter((chat) => {
      const filterMatch =
        chatFilter === "all" ||
        (chatFilter === "groups" && chat.kind === "group") ||
        (chatFilter === "direct" && chat.kind === "direct");

      const queryMatch =
        normalized.length === 0 ||
        chat.name.toLowerCase().includes(normalized) ||
        chat.subtitle.toLowerCase().includes(normalized) ||
        chat.lastMessage.toLowerCase().includes(normalized);

      return filterMatch && queryMatch;
    });
  }, [chatFilter, chatList, query]);

  useEffect(() => {
    if (filteredChats.length === 0) {
      return;
    }

    const exists = filteredChats.some((chat) => chat.id === selectedChatId);
    if (!exists) {
      setSelectedChatId(filteredChats[0].id);
    }
  }, [filteredChats, selectedChatId]);

  useEffect(() => {
    setChatList((current) =>
      current.map((chat) => (chat.id === selectedChatId && chat.unread > 0 ? { ...chat, unread: 0 } : chat))
    );
  }, [selectedChatId]);

  const selectedChat = useMemo(
    () => chatList.find((chat) => chat.id === selectedChatId) ?? filteredChats[0] ?? null,
    [chatList, filteredChats, selectedChatId]
  );

  const selectedMessages = selectedChat ? messageMap[selectedChat.id] ?? [] : [];

  function handleSendMessage(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (!selectedChat) {
      return;
    }

    const text = draft.trim();
    if (!text) {
      return;
    }

    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const message: ChatMessage = {
      id: `${selectedChat.id}-${now.getTime()}`,
      sender: "me",
      author: "You",
      body: text,
      time
    };

    setMessageMap((current) => ({
      ...current,
      [selectedChat.id]: [...(current[selectedChat.id] ?? []), message]
    }));

    setChatList((current) => {
      const updated = current.map((chat) =>
        chat.id === selectedChat.id ? { ...chat, lastMessage: text, time, unread: 0 } : chat
      );

      const selectedIndex = updated.findIndex((chat) => chat.id === selectedChat.id);
      if (selectedIndex <= 0) {
        return updated;
      }

      const [selected] = updated.splice(selectedIndex, 1);
      return [selected, ...updated];
    });

    setDraft("");
  }

  return (
    <section className="messenger-page">
      <header className="messenger-header-card">
        <div>
          <p className="eyebrow">Communication hub</p>
          <h1>Messenger</h1>
          <p>Secure internal messaging for direct chats and coordinated group conversations.</p>
        </div>
        <div className="messenger-head-metrics" aria-label="Messenger stats">
          <article className="messenger-metric-chip">
            <span>Unread</span>
            <strong>{unreadCount}</strong>
          </article>
          <article className="messenger-metric-chip">
            <span>Groups</span>
            <strong>{groupCount}</strong>
          </article>
          <article className="messenger-metric-chip">
            <span>Direct</span>
            <strong>{directCount}</strong>
          </article>
        </div>
      </header>

      <div className="messenger-shell">
        <aside className="messenger-sidebar">
          <div className="messenger-sidebar-top">
            <label className="messenger-search" aria-label="Search conversations">
              <SearchIcon />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search chats..."
              />
            </label>

            <div className="messenger-filter-row" role="tablist" aria-label="Message filters">
              {filterOptions.map((option) => (
                <button
                  key={option.id}
                  className={`messenger-filter-btn ${chatFilter === option.id ? "active" : ""}`}
                  onClick={() => setChatFilter(option.id)}
                  role="tab"
                  aria-selected={chatFilter === option.id}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <ul className="messenger-chat-list">
            {filteredChats.length === 0 ? (
              <li className="messenger-empty-list">No chats match your filter.</li>
            ) : (
              filteredChats.map((chat) => {
                const isActive = selectedChat?.id === chat.id;
                return (
                  <li key={chat.id}>
                    <button
                      className={`messenger-chat-btn ${isActive ? "active" : ""}`}
                      onClick={() => setSelectedChatId(chat.id)}
                    >
                      <div className={`messenger-avatar ${chat.kind}`}>
                        <span>{getInitials(chat.name)}</span>
                        {chat.online ? <i aria-hidden="true" /> : null}
                      </div>

                      <div className="messenger-chat-copy">
                        <strong>{chat.name}</strong>
                        <small>{chat.subtitle}</small>
                        <p>{chat.lastMessage}</p>
                      </div>

                      <div className="messenger-chat-meta">
                        <time>{chat.time}</time>
                        {chat.unread > 0 ? <span>{chat.unread}</span> : null}
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </aside>

        <section className="messenger-thread">
          {selectedChat ? (
            <>
              <header className="messenger-thread-header">
                <div className="messenger-thread-title">
                  <div className={`messenger-avatar ${selectedChat.kind}`}>
                    <span>{getInitials(selectedChat.name)}</span>
                    {selectedChat.online ? <i aria-hidden="true" /> : null}
                  </div>
                  <div>
                    <h2>{selectedChat.name}</h2>
                    <p>
                      {selectedChat.kind === "group"
                        ? `${selectedChat.members ?? 0} participants`
                        : selectedChat.online
                        ? "Online now"
                        : "Offline"}
                    </p>
                  </div>
                </div>
                <span className="messenger-kind-pill">{selectedChat.kind === "group" ? "Group" : "Direct"}</span>
              </header>

              <div className="messenger-thread-body">
                {selectedMessages.map((message) => (
                  <article key={message.id} className={`messenger-bubble ${message.sender}`}>
                    {message.sender === "other" ? <strong>{message.author}</strong> : null}
                    <p>{message.body}</p>
                    <span>{message.time}</span>
                  </article>
                ))}
              </div>

              <form className="messenger-composer" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Write a message..."
                />
                <button type="submit" className="btn-solid" disabled={draft.trim().length === 0}>
                  <SendIcon />
                  Send
                </button>
              </form>
            </>
          ) : (
            <article className="messenger-thread-empty">
              <h2>No conversation selected</h2>
              <p>Select a chat from the left to view messages.</p>
            </article>
          )}
        </section>

        <aside className="messenger-info-card">
          <h3>Conversation Details</h3>
          {selectedChat ? (
            <>
              <ul className="messenger-info-list">
                <li>
                  <span>Type</span>
                  <strong>{selectedChat.kind === "group" ? "Group chat" : "Direct chat"}</strong>
                </li>
                <li>
                  <span>Status</span>
                  <strong>{selectedChat.online ? "Active now" : "Inactive"}</strong>
                </li>
                <li>
                  <span>Last update</span>
                  <strong>{selectedChat.time}</strong>
                </li>
                {selectedChat.kind === "group" ? (
                  <li>
                    <span>Participants</span>
                    <strong>{selectedChat.members ?? 0}</strong>
                  </li>
                ) : null}
              </ul>

              <div className="messenger-note">
                <p>Message traffic in this thread is encrypted and retained for governance audit.</p>
              </div>
            </>
          ) : (
            <p className="summary-copy">Select a conversation to view details.</p>
          )}
        </aside>
      </div>
    </section>
  );
}
