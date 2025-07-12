import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  TouchEvent,
} from "react";

// Favicon for chat (insert in the <head> using a React effect)
useEffect(() => {
  const link = document.createElement("link");
  link.rel = "icon";
  link.type = "image/svg+xml";
  // Simple chat bubble SVG as favicon
  link.href =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='cyan'%3E%3Cpath d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'/%3E%3C/svg%3E";
  document.head.appendChild(link);
  return () => {
    document.head.removeChild(link);
  };
}, []);

interface Participant {
  id: string;
  name: string;
  isActive: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
  stream?: MediaStream;
  isScreenShareOn: boolean;
  audioContext?: AudioContext;
  analyser?: AnalyserNode;
}

interface Message {
  id: number;
  sender: string;
  time: Date;
  content: string;
}

interface PinchState {
  initialDistance: number;
  scale: number;
}

const EndCall = ({
  setIsCallFinished,
}: {
  setIsCallFinished: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-teal-900 to-teal-950 text-white px-4">
      {/* End call icon */}
      <div className="bg-gradient-to-br from-cyan-500 to-teal-600 rounded-full p-6 shadow-lg shadow-cyan-500/30 mb-8 transform-gpu hover:scale-105 transition-transform">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-12 w-12 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path>
          <line x1="23" y1="1" x2="1" y2="23"></line>
        </svg>
      </div>

      <h1 className="text-3xl font-semibold mb-3 text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-200">
        Meeting Ended
      </h1>

      <p className="text-teal-300 text-center mb-8 max-w-md">
        Thank you for participating. You can return to the meeting or close this
        window.
      </p>

      <button
        className="bg-gradient-to-r from-cyan-600 to-teal-700 hover:from-cyan-700 hover:to-teal-800 transition-all px-6 py-3 rounded-lg font-medium shadow-lg shadow-cyan-500/20 flex items-center space-x-2 transform-gpu hover:scale-[1.02]"
        onClick={() => setIsCallFinished(false)}
        title="Return to meeting"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 10l5 5-5 5"></path>
          <path d="M4 4v7a4 4 0 0 0 4 4h12"></path>
        </svg>
        <span>Return to Meeting</span>
      </button>
    </div>
  );
};

const Chat = ({
  messages,
  newMessage,
  setNewMessage,
  setIsChatOpen,
  isChatOpen,
  sendMessage,
}: {
  messages: Message[];
  newMessage: string;
  setNewMessage: React.Dispatch<React.SetStateAction<string>>;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  sendMessage: () => void;
  isChatOpen: boolean;
}) => {
  const Message = ({ message }: { message: Message }) => {
    return (
      <div
        className={`flex ${
          message.sender == "You" ? "justify-start" : "justify-end"
        }`}
      >
        <div
          className={`rounded-lg px-3 py-2 mx-2 w-full max-w-[280px] md:max-w-[280px] break-words shadow-sm overflow-hidden ${
            message.sender == "You"
              ? "bg-cyan-600/60 backdrop-blur-sm border border-cyan-500/20"
              : "bg-teal-800/80 backdrop-blur-sm border border-teal-700/30"
          }`}
        >
          <div key={message.id} className="message">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-white/90">
                {message.sender}
              </span>
              <span className="text-white/60 text-xs ml-2 whitespace-nowrap">
                {message.time.toLocaleString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </span>
            </div>
            <div className="text-white pt-1 break-all word-break:break-word hyphens-auto">
              {message.content}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        className={`transition-transform duration-300 delay-300 fixed z-50 top-0 right-0 h-full flex flex-col justify-between bg-zinc-900/95 backdrop-blur-md rounded-l-2xl border-l border-zinc-800/50 shadow-xl ${
          isChatOpen
            ? "translate-x-0 w-full md:w-[350px]"
            : "w-0 translate-x-[100%]"
        }`}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b border-blue-800/70 bg-gradient-to-r from-blue-900/90 to-blue-800/50">
          <h2 className="text-xl text-cyan-400 font-medium flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-fuchsia-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            Chat
          </h2>
          <button
            className="flex items-center justify-center hover:bg-fuchsia-700/40 rounded-full w-8 h-8 p-1 cursor-pointer text-fuchsia-400 hover:text-white transition-colors"
            onClick={() => setIsChatOpen(false)}
            title="Close chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-scroll flex flex-col gap-3 px-2 pt-3 pb-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-teal-400 text-sm px-4 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 mb-2 text-teal-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                <circle cx="9" cy="10" r="1"></circle>
                <circle cx="14" cy="10" r="1"></circle>
                <path d="M9.5 14a2.5 2.5 0 0 0 5 0"></path>
              </svg>
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg, index) => (
              <Message message={msg} key={index}></Message>
            ))
          )}
        </div>

        <div className="flex items-center gap-2 w-full py-3 px-3 border-t border-blue-800/70 bg-blue-900/80">
          <input
            className="bg-zinc-800 rounded-full px-4 py-2 flex-1 text-white placeholder-blue-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 border border-zinc-700/50"
            type="text"
            name="newMessage"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                sendMessage();
              }
            }}
            title="Type your message here"
          />
          <button
            className={`${
              newMessage.trim()
                ? "bg-fuchsia-600 hover:bg-fuchsia-700"
                : "bg-fuchsia-600/50 cursor-not-allowed"
            } transition-colors p-2 rounded-full text-white flex items-center justify-center shadow-md`}
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            title="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

const FloatingControls = ({
  showControls,
  participants,
  toggleMute,
  toggleVideo,
  setIsCallFinished,
}: {
  showControls: boolean;
  participants: Participant[];
  toggleMute: () => void;
  toggleVideo: () => void;
  setIsCallFinished: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <div
      className={`
        fixed top-4 right-4 flex gap-3 bg-zinc-900/80 backdrop-blur-md px-4 py-3 rounded-full z-40
        transition-all duration-300 ease-in-out shadow-xl border border-white/10
        ${showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[-20px]"}
      `}
    >
      <button
        className={`flex justify-center items-center rounded-full w-10 h-10 ${
          participants[0].isMuted
            ? "bg-pink-600 hover:bg-pink-700 shadow-md shadow-pink-500/20"
            : "bg-cyan-600 hover:bg-cyan-700 shadow-md shadow-cyan-500/20"
        } cursor-pointer transition-all`}
        onClick={toggleMute}
        title={participants[0].isMuted ? "Unmute" : "Mute"}
      >
        {participants[0].isMuted ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="1" y1="1" x2="23" y2="23"></line>
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        )}
      </button>

      <button
        className={`flex justify-center items-center rounded-full w-10 h-10 ${
          !participants[0].isVideoOn
            ? "bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-500/20"
            : "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
        } cursor-pointer transition-all`}
        onClick={toggleVideo}
        title={participants[0].isVideoOn ? "Turn off camera" : "Turn on camera"}
      >
        {!participants[0].isVideoOn ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="23 7 16 12 23 17 23 7"></polygon>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
          </svg>
        )}
      </button>

      <button
        className="flex justify-center items-center rounded-full w-10 h-10 bg-red-600 hover:bg-red-700 cursor-pointer transition-all shadow-md shadow-red-600/20"
        onClick={() => setIsCallFinished(true)}
        title="End call"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"></path>
          <line x1="23" y1="1" x2="1" y2="23"></line>
        </svg>
      </button>
    </div>
  );
};

const BottomBar = ({
  showControls,
  orientation,
  toggleScreenShare,
  setIsChatOpen,
  messages,
  isScreenShareSupported,
}: {
  showControls: boolean;
  orientation: string;
  toggleScreenShare: () => void;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  messages: Message[];
  isScreenShareSupported: boolean;
}) => {
  return (
    <div className="flex justify-center">
      <div
        className={`fixed bottom-4 z-50 bg-zinc-900/80 backdrop-blur-md rounded-full shadow-lg border border-white/10
            transition-all duration-300 ease-in-out
            ${
              showControls
                ? "translate-y-0 opacity-100 pointer-events-auto"
                : "translate-y-[150%] opacity-0 pointer-events-none delay-300"
            }
            ${orientation === "portrait" ? "w-auto max-w-[70%]" : "w-auto"}
          `}
      >
        <div className="flex gap-4 px-5 py-3 items-center">
          <button
            className={`flex items-center justify-center text-white hover:bg-blue-700/40 rounded-full w-10 h-10 transition-colors ${
              !isScreenShareSupported ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={isScreenShareSupported ? toggleScreenShare : undefined}
            title={isScreenShareSupported ? "Share screen" : "Screen sharing not supported on this device"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </button>

          <button
            className="flex items-center justify-center text-white hover:bg-fuchsia-700/40 rounded-full w-10 h-10 transition-colors relative"
            onClick={() => setIsChatOpen(true)}
            title="Open chat"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>

            {messages.length > 0 && (
              <div className="absolute -top-1 -right-1 bg-blue-600 rounded-full h-5 w-5 flex items-center justify-center shadow-sm shadow-blue-500/20 border border-blue-500/70">
                <span className="text-xs text-white font-medium">
                  {messages.length >= 99 ? "99+" : messages.length}
                </span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function VideoMeetApp() {
  const [isCallFinished, setIsCallFinished] = useState<boolean>(false);

  const COLORS = [
    { outsideColor: "bg-teal-800/50", circleColor: "bg-cyan-500" },
    { outsideColor: "bg-blue-900/50", circleColor: "bg-blue-500" },
    { outsideColor: "bg-purple-900/50", circleColor: "bg-purple-500" },
    { outsideColor: "bg-pink-900/50", circleColor: "bg-pink-500" },
    { outsideColor: "bg-teal-900/50", circleColor: "bg-cyan-600" },
    { outsideColor: "bg-fuchsia-900/50", circleColor: "bg-fuchsia-500" },
    { outsideColor: "bg-indigo-900/50", circleColor: "bg-indigo-500" },
    { outsideColor: "bg-emerald-900/50", circleColor: "bg-emerald-500" },
    { outsideColor: "bg-cyan-900/50", circleColor: "bg-cyan-400" },
    { outsideColor: "bg-blue-900/50", circleColor: "bg-blue-400" },
  ];

  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: "1",
      name: "You",
      isActive: false,
      isMuted: false,
      isVideoOn: false,
      isScreenShareOn: false,
    },
    {
      id: "2",
      name: "John Doe",
      isActive: true,
      isMuted: false,
      isVideoOn: false,
      isScreenShareOn: false,
    },
    {
      id: "3",
      name: "Jane Smith",
      isActive: false,
      isMuted: false,
      isVideoOn: false,
      isScreenShareOn: false,
    },
    {
      id: "4",
      name: "Mike Johnson",
      isActive: false,
      isMuted: false,
      isVideoOn: false,
      isScreenShareOn: false,
    },
    {
      id: "5",
      name: "Sarah Wilson",
      isActive: false,
      isMuted: false,
      isVideoOn: false,
      isScreenShareOn: false,
    },
    {
      id: "6",
      name: "Alex Chen",
      isActive: false,
      isMuted: false,
      isVideoOn: false,
      isScreenShareOn: false,
    },
    {
      id: "7",
      name: "Emma Rodriguez",
      isActive: false,
      isMuted: false,
      isVideoOn: false,
      isScreenShareOn: false,
    },
    {
      id: "8",
      name: "David Kim",
      isActive: false,
      isMuted: false,
      isVideoOn: false,
      isScreenShareOn: false,
    },
    {
      id: "9",
      name: "Angelina Jolie",
      isActive: false,
      isMuted: false,
      isVideoOn: false,
      isScreenShareOn: false,
    },
    {
      id: "10",
      name: "Brad Pitt",
      isActive: false,
      isMuted: false,
      isVideoOn: false,
      isScreenShareOn: false,
    },
    {
      id: "11",
      name: "Tom Hanks",
      isActive: false,
      isMuted: false,
      isVideoOn: false,
      isScreenShareOn: false,
    },
    {
      id: "12",
      name: "Meryl Streep",
      isActive: false,
      isMuted: false,
      isVideoOn: false,
      isScreenShareOn: false,
    },
  ]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      setMessages((prev) => [
        ...prev,
        {
          id: messageIdCount,
          sender: "You",
          content: newMessage,
          time: new Date(),
        },
      ]);
      setMessageIdCount((prev) => prev + 1);
      setNewMessage("");
    }
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      sender: "John Doe",
      time: new Date(Date.now() - 1000 * 60 * 5),
      content: "Hey everyone, is the meeting starting soon?",
    },
    {
      id: 1,
      sender: "Jane Smith",
      time: new Date(Date.now() - 1000 * 60 * 2),
      content: "Yes, I'm here and ready!",
    },
    {
      id: 2,
      sender: "You",
      time: new Date(),
      content: "Great, let's begin the meeting.",
    },
  ]);

  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchRef.current = { initialDistance: distance, scale: 1 };
    }
  }, []);

  const [zoomScale, setZoomScale] = useState(1);
  const handleTouchMove = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 2 && pinchRef.current && videoGridRef.current) {
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );

        const scale = distance / pinchRef.current.initialDistance;

        const clamped = Math.min(Math.max(scale, 1), 3);
        setZoomScale(clamped);

        const activeSpeaker = participants.find((p) => p.isActive);
        if (activeSpeaker && scale > 1.2) {
          setPinnedParticipantId(activeSpeaker.id);
        } else if (scale < 0.8) {
          setPinnedParticipantId(null);
        }
      }
    },
    [participants]
  );

  const handleTouchEnd = useCallback(() => {
    pinchRef.current = null;
    setZoomScale(1);
    setPinnedParticipantId(null);
  }, []);

  // Audio level detection for active speaker
  useEffect(() => {
    const audioContexts: AudioContext[] = [];
    const analysers: AnalyserNode[] = [];
    const dataArrays: Uint8Array[] = [];
    const intervals: NodeJS.Timeout[] = [];

    // Set up audio analysis for each participant
    participants.forEach((participant, index) => {
      if (participant.id !== "1") {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 32;
        
        const mediaStream = new MediaStream();
        const audioTrack = mediaStream.getAudioTracks()[0];
        if (audioTrack) {
          const source = audioContext.createMediaStreamSource(new MediaStream([audioTrack]));
          source.connect(analyser);
          
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          dataArrays[index] = dataArray;
          
          audioContexts[index] = audioContext;
          analysers[index] = analyser;
          
          // Check audio levels every 200ms
          intervals[index] = setInterval(() => {
            analyser.getByteFrequencyData(dataArray);
            const volume = Math.max(...dataArray);
            
            if (volume > 50) { // Threshold for speaking
              setParticipants(prev => 
                prev.map((p, i) => ({
                  ...p,
                  isActive: i === index
                }))
              );
            }
          }, 200);
        }
      }
    });

    return () => {
      intervals.forEach(clearInterval);
      audioContexts.forEach(ctx => ctx.close());
    };
  }, [participants]);

  const [messageIdCount, setMessageIdCount] = useState<number>(3);
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(
    null
  );
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isScreenShareSupported, setIsScreenShareSupported] = useState(false);

  // Track the last read message id for unread badge
  const getLastOtherMessageId = (msgs: Message[]) =>
    Math.max(0, ...msgs.filter((m) => m.sender !== "You").map((m) => m.id));
  const [lastReadOtherMessageId, setLastReadOtherMessageId] = useState<number>(
    getLastOtherMessageId(messages)
  );

  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    window.innerHeight > window.innerWidth ? "portrait" : "landscape"
  );

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [newMessage, setNewMessage] = useState<string>("");
  const pinchRef = useRef<PinchState | null>(null);
  const videoGridRef = useRef<HTMLDivElement>(null);

  const toggleMute = () => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === "1" ? { ...p, isMuted: !p.isMuted } : p))
    );
  };

  useEffect(() => {
    if (isChatOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isChatOpen]);

  useEffect(() => {
    setIsScreenShareSupported('getDisplayMedia' in navigator.mediaDevices);
  }, []);

  const toggleVideo = () => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id === "1") {
          if (!p.isVideoOn) {
            navigator.mediaDevices
              .getUserMedia({ video: true })
              .then(() => {
                setParticipants((prev) =>
                  prev.map((participant) =>
                    participant.id === "1"
                      ? { ...participant, isVideoOn: true }
                      : participant
                  )
                );
              })
              .catch((err) => {
                console.error("Could not access camera:", err);
                alert(
                  "Could not access camera. Please check your permissions."
                );
              });
            return p;
          }
          return { ...p, isVideoOn: false };
        }
        return p;
      })
    );
  };

  const toggleScreenShare = () => {
    if (!isScreenShareSupported) return;
    
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === "1" ? { ...p, isScreenShareOn: !p.isScreenShareOn } : p
      )
    );
  };

  const screenShareStreamRef = useRef<MediaStream | null>(null);

  const me = participants.find((p) => p.id === "1");

  const isScreenSharing = me?.isScreenShareOn;

  useEffect(() => {
    if (isScreenSharing) {
      navigator.mediaDevices
        .getDisplayMedia({ video: true })
        .then((stream) => {
          screenShareStreamRef.current = stream;

          stream.getVideoTracks()[0].addEventListener("ended", () => {
            setParticipants((prev) =>
              prev.map((p) =>
                p.id === "1" ? { ...p, isScreenShareOn: false } : p
              )
            );
          });
        })
        .catch((error) => {
          console.error("Error sharing screen:", error);
          setParticipants((prev) =>
            prev.map((p) =>
              p.id === "1" ? { ...p, isScreenShareOn: false } : p
            )
          );
        });
    } else {
      if (screenShareStreamRef.current) {
        screenShareStreamRef.current.getTracks().forEach((t) => t.stop());
        screenShareStreamRef.current = null;
      }
    }

    return () => {
      if (screenShareStreamRef.current) {
        screenShareStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isScreenSharing]);

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? "portrait" : "landscape"
      );
    };

    window.addEventListener("resize", handleOrientationChange);
    window.addEventListener("orientationchange", handleOrientationChange);

    return () => {
      window.removeEventListener("resize", handleOrientationChange);
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, []);

  const resetControlsTimeout = () => {
    setShowControls((prev) => {
      if (!prev) return true;
      return prev;
    });

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    const handleInteraction = () => {
      resetControlsTimeout();
    };

    window.addEventListener("mousemove", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);
    window.addEventListener("click", handleInteraction);

    resetControlsTimeout();

    return () => {
      window.removeEventListener("mousemove", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("click", handleInteraction);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      setLastReadOtherMessageId(getLastOtherMessageId(messages));
    }
  }, [isChatOpen, messages]);

  // Calculate unread messages from others (not 'You')
  const unreadCount = messages.filter(
    (msg) => msg.sender !== "You" && msg.id > lastReadOtherMessageId
  ).length;

  const CameraTile = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [cameraError, setCameraError] = useState(false);

    useEffect(() => {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Error accessing the camera:", err);
          setCameraError(true);
        });

      return () => {
        if (videoRef.current && videoRef.current.srcObject) {
          const tracks = (
            videoRef.current.srcObject as MediaStream
          ).getTracks();
          tracks.forEach((track) => track.stop());
        }
      };
    }, []);

    if (cameraError) {
      return (
        <div className="aspect-video bg-black overflow-hidden relative h-full w-full shadow-inner flex items-center justify-center">
          <div className="text-center p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 mx-auto mb-2 text-red-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
            <p className="text-white text-sm">Camera access error</p>
          </div>
        </div>
      );
    }

    return (
      <div className="aspect-video bg-black overflow-hidden relative h-full w-full shadow-inner">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none z-10"></div>

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      </div>
    );
  };

  const ScreenShareTile = ({ stream }: { stream: MediaStream | null }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }, [stream]);

    return (
      <div className="aspect-video bg-black overflow-hidden relative h-full w-full shadow-inner">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none z-10"></div>

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        <div className="absolute top-2 right-2 px-2 py-1 bg-cyan-600/70 backdrop-blur-sm rounded-md text-xs font-medium text-white flex items-center z-20">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 mr-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
          Sharing
        </div>
      </div>
    );
  };

  const VideoTile = ({
    participant,
    pinned,
    zoomScale = 1,
  }: {
    participant: Participant;
    pinned: boolean;
    zoomScale?: number;
  }) => {
    const selectedColors =
      COLORS[Number.parseInt(participant.id) % COLORS.length];
    return (
      <div
        style={{
          aspectRatio: "16/9",
          transform: pinned ? `scale(${zoomScale})` : 'scale(1)',
          transformOrigin: 'center center',
        }}
        className={`
          relative 
          w-full 
          aspect-video
          ${
            participant.isVideoOn || participant.isScreenShareOn
              ? "bg-black"
              : selectedColors.outsideColor
          } 
          rounded-xl overflow-hidden
          ${
            participant.isActive
              ? "ring-2 ring-cyan-400 shadow-cyan-400/20 shadow-sm"
              : ""
          }
          ${
            pinned
              ? "z-10 shadow-2xl ring-4 ring-cyan-500 shadow-cyan-500/20"
              : "shadow-lg shadow-black/30"
          }
          transition-all duration-300
        `}
      >
        <div className="flex flex-col justify-center items-center w-full h-full">
          <div className="flex flex-col w-full h-full">
            {participant.isScreenShareOn ? (
              <ScreenShareTile stream={screenShareStreamRef.current} />
            ) : participant.isVideoOn ? (
              <CameraTile />
            ) : (
              <div className="flex justify-center items-center h-full bg-gradient-to-br from-transparent to-black/20">
                <div
                  className={`flex justify-center items-center w-20 h-20 ${selectedColors.circleColor} text-white rounded-full shadow-lg`}
                >
                  <span className="text-4xl font-medium">
                    {participant.name.charAt(0)}
                  </span>
                </div>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 px-2 py-2 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center justify-between mx-1">
                <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-sm rounded-md flex items-center shadow-sm">
                  {participant.name}
                </span>

                {participant.isActive && (
                  <span className="px-2 py-1 bg-cyan-500/70 backdrop-blur-sm text-white text-xs rounded-md shadow-sm flex items-center">
                    <span className="w-2 h-2 rounded-full bg-cyan-300 mr-1 animate-pulse"></span>
                    Speaking
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {participant.isMuted && (
          <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm rounded-full p-1.5 shadow-lg">
            <div className="bg-red-500/90 rounded-full w-8 h-8 flex items-center justify-center shadow-inner">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
              </svg>
            </div>
          </div>
        )}
      </div>
    );
  };

  const VideoGrid = ({ zoomScale = 1 }: { zoomScale?: number }) => {
    const filteredParticipants = pinnedParticipantId
      ? participants.filter((p) => p.id === pinnedParticipantId)
      : participants;

    // Responsive grid by orientation
    let gridCols = "";
    if (pinnedParticipantId) {
      gridCols = "grid-cols-1 aspect-video";
    } else if (orientation === "portrait") {
      if (filteredParticipants.length <= 2) gridCols = "grid-cols-1";
      else if (filteredParticipants.length <= 4) gridCols = "grid-cols-2";
      else gridCols = "grid-cols-2";
    } else {
      if (filteredParticipants.length <= 2) gridCols = "grid-cols-2";
      else if (filteredParticipants.length <= 4) gridCols = "grid-cols-2 md:grid-cols-4";
      else gridCols = "grid-cols-3 md:grid-cols-4";
    }

    return (
      <div
        ref={videoGridRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`grid ${gridCols} auto-rows-[minmax(0,1fr)] bg-gradient-to-b from-[#0a0f1a] via-[#0f172a] to-[#0a0f1a] gap-1 md:gap-3 p-1 md:p-3
          justify-center items-center min-h-[100vh]`}
      >
        {filteredParticipants.map((p, index) => (
          <VideoTile
            zoomScale={zoomScale}
            key={index}
            participant={p}
            pinned={p.id === pinnedParticipantId}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
          body {
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(to bottom, #0a0f1a 0%, #0f172a 60%, #0a0f1a 100%);
            color: #f8fafc;
          }
          ::-webkit-scrollbar {
            width: 6px;
          }
          ::-webkit-scrollbar-track {
            background: rgba(20, 184, 166, 0.08);
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(6, 182, 212, 0.18);
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(6, 182, 212, 0.28);
          }
          .smooth-transition {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
        `}
      </style>
      {!isCallFinished ? (
        <div
          className={`min-h-[100vh] h-full bg-gradient-to-b from-[#0a0f1a] via-[#0f172a] to-[#0a0f1a] ${
            isChatOpen ? "overflow-hidden" : ""
          }`}
        >
          <div
            className={`transition-all duration-300 ${
              isChatOpen ? "md:pr-[350px]" : ""
            }`}
          >
            <VideoGrid zoomScale={zoomScale} />
          </div>

          <BottomBar
            messages={messages.filter((msg) => msg.sender !== "You")}
            orientation={orientation}
            showControls={showControls}
            setIsChatOpen={setIsChatOpen}
            toggleScreenShare={toggleScreenShare}
            isScreenShareSupported={isScreenShareSupported}
          />

          <Chat
            messages={messages}
            newMessage={newMessage}
            sendMessage={sendMessage}
            setNewMessage={setNewMessage}
            setIsChatOpen={setIsChatOpen}
            isChatOpen={isChatOpen}
          />

          <FloatingControls
            participants={participants}
            setIsCallFinished={setIsCallFinished}
            showControls={showControls}
            toggleMute={toggleMute}
            toggleVideo={toggleVideo}
          />
        </div>
      ) : (
        <EndCall setIsCallFinished={setIsCallFinished} />
      )}
    </>
  );
}