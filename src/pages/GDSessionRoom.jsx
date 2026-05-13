import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import jsPDF from 'jspdf';
import api, { getBaseURL } from '../api';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.services.mozilla.com' },
  ]
};

function GDSessionRoom() {
  const { inviteLink } = useParams();
  const navigate = useNavigate();
  
  // State
  const [localStream, setLocalStream] = useState(null);
  const [remotePeers, setRemotePeers] = useState([]); // Array of { userId, name, stream }
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareUserId, setScreenShareUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [botCount, setBotCount] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isInterviewMode, setIsInterviewMode] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMomModal, setShowMomModal] = useState(false);
  const [mom, setMom] = useState('');
  const [isGeneratingMom, setIsGeneratingMom] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(340);
  const [isResizing, setIsResizing] = useState(false);

  // --- Speech Recognition ---
  const recognitionRef = useRef(null);
  const resizerRef = useRef(null);

  // Refs for non-reactive storage
  const socketRef = useRef();
  const userVideo = useRef();
  const peersRef = useRef({}); // { userId: RTCPeerConnection }
  const streamRef = useRef();
  const chatContainerRef = useRef();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userName = user?.name || 'Anonymous';

  // --- 1. Initial Setup: Auth, Media, and Socket ---
  useEffect(() => {
    if (!user) {
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      navigate('/login');
      return;
    }

    const initSession = async () => {
      const normalizedRoomId = inviteLink.trim().toLowerCase();
      try {
        // A. Check Session Validity
        const statusRes = await api.get(`/api/sessions/join/${normalizedRoomId}`);
        const sessionData = statusRes.data;

        // Enforce Scheduling Lock
        if (!sessionData.isImmediate) {
           const sessionDate = new Date(`${sessionData.date}T${sessionData.time}`);
           const now = new Date();
           if (now < sessionDate) { 
             setError(`This session is scheduled for ${sessionData.date} at ${sessionData.time}. Please wait until the scheduled time to join.`);
             setIsLoading(false);
             return;
           }
        }

        setBotCount(sessionData.aiCount || 0);
        setIsInterviewMode(statusRes.data.isInterviewMode || false);
        setJobDescription(statusRes.data.jobDescription || "");
        setChatEnabled(sessionData.chatEnabled !== false);
        
        const creatorId = sessionData.creator?._id || sessionData.creator;
        if (user?._id === creatorId || user?.id === creatorId) {
          setIsCreator(true);
        }

        // B. Get Local Media (Granular resilient approach)
        let stream = null;
        try {
          // Attempt 1: Full AV
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            } 
          });
        } catch (e) {
          console.warn("Combined AV failed, trying individual devices...", e.name);
          try {
            // Attempt 2: Video only
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            // If video works, try adding audio track later (optional, but let's keep it simple)
          } catch (vErr) {
            console.warn("Video failed, trying audio only...", vErr.name);
            try {
              // Attempt 3: Audio only
              stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true
                } 
              });
            } catch (aErr) {
              console.error("All media devices failed or missing:", aErr.name);
              // Join as spectator
            }
          }
        }
        
        streamRef.current = stream;
        setLocalStream(stream);
        if (userVideo.current && stream) userVideo.current.srcObject = stream;

        // C. Initialize Speech Recognition
        if (stream && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
          const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = true;
          recognitionRef.current.interimResults = false;
          recognitionRef.current.lang = 'en-US';

          recognitionRef.current.onresult = (event) => {
            const lastMatch = event.results.length - 1;
            const text = event.results[lastMatch][0].transcript;
            if (text.trim()) {
              socketRef.current.emit('transcript-update', { 
                roomId: normalizedRoomId, 
                sender: userName, 
                text 
              });
            }
          };

          recognitionRef.current.onerror = (e) => console.warn("STT Error:", e);
          recognitionRef.current.onend = () => {
            if (streamRef.current?.getAudioTracks()[0]?.enabled) {
               recognitionRef.current.start();
            }
          };
          
          recognitionRef.current.start();
          setIsTranscribing(true);
        }

        // D. Initialize Socket
        socketRef.current = io(getBaseURL(), {
          transports: ['polling', 'websocket']
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
          socket.emit('join-room', { roomId: normalizedRoomId, name: userName });
        });

        socket.on('chat-toggle', ({ enabled }) => {
          setChatEnabled(enabled);
        });

        // --- Signaling Handlers ---
        socket.on('all-users', users => {
          users.forEach(u => {
            const peer = createPeer(u.userId, socket.id, stream, u.name);
            peersRef.current[u.userId] = peer;
            setRemotePeers(prev => [...prev, { userId: u.userId, name: u.name, stream: null }]);
          });
          setIsLoading(false);
        });

        socket.on('user-joined', async ({ signal, callerId, name }) => {
          if (peersRef.current[callerId]) peersRef.current[callerId].close();
          const peer = addPeer(signal, callerId, stream, name);
          peersRef.current[callerId] = peer;
          setRemotePeers(prev => {
            const filtered = prev.filter(p => p.userId !== callerId);
            return [...filtered, { userId: callerId, name, stream: null }];
          });
        });

        socket.on('receiving-returned-signal', ({ signal, id }) => {
          const peer = peersRef.current[id];
          if (peer) peer.setRemoteDescription(new RTCSessionDescription(signal));
        });

        socket.on('ice-candidate', ({ candidate, from }) => {
          const peer = peersRef.current[from];
          if (peer) peer.addIceCandidate(new RTCIceCandidate(candidate));
        });

        socket.on('chat-message', data => {
          setMessages(prev => [...prev, data]);
        });

        socket.on('user-left', id => {
          if (peersRef.current[id]) {
            peersRef.current[id].close();
            delete peersRef.current[id];
          }
          setRemotePeers(prev => prev.filter(p => p.userId !== id));
          setScreenShareUserId(prev => prev === id ? null : prev);
        });

        socket.on('screen-share-status', ({ userId, isSharing }) => {
          setScreenShareUserId(isSharing ? userId : null);
        });

        setIsLoading(false);
      } catch (err) {
        console.error("CRITICAL INIT ERROR:", err);
        setError(`Failed to initialize: ${err.message || "Unknown Error"}. Please ensure camera permissions are granted and you are using a supported browser like Chrome.`);
        setIsLoading(false);
      }
    };

    initSession();

    const handleUnload = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      socketRef.current?.disconnect();
      handleUnload();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [inviteLink, navigate]);

  // --- Resizing Logic ---
  const startResizing = (e) => {
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth > 200 && newWidth < 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // --- 2. Peer Connection Logic ---
  const createPeer = (userToSignal, callerId, stream, name) => {
    const peer = new RTCPeerConnection(ICE_SERVERS);
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
    peer.onicecandidate = e => {
      if (e.candidate) socketRef.current.emit('ice-candidate', { targetId: userToSignal, candidate: e.candidate });
    };
    peer.ontrack = e => {
      setRemotePeers(prev => prev.map(p => {
        if (p.userId === userToSignal) {
          const currentStream = p.stream || new MediaStream();
          if (!currentStream.getTracks().find(t => t.id === e.track.id)) {
            currentStream.addTrack(e.track);
          }
          return { ...p, stream: new MediaStream(currentStream.getTracks()) };
        }
        return p;
      }));
    };
    peer.createOffer().then(offer => {
      peer.setLocalDescription(offer);
      socketRef.current.emit('sending-signal', { userToSignal, signal: offer, callerId });
    });
    return peer;
  };

  const addPeer = (incomingSignal, callerId, stream, name) => {
    const peer = new RTCPeerConnection(ICE_SERVERS);
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
    peer.onicecandidate = e => {
      if (e.candidate) socketRef.current.emit('ice-candidate', { targetId: callerId, candidate: e.candidate });
    };
    peer.ontrack = e => {
      setRemotePeers(prev => prev.map(p => {
        if (p.userId === callerId) {
          const currentStream = p.stream || new MediaStream();
          if (!currentStream.getTracks().find(t => t.id === e.track.id)) {
            currentStream.addTrack(e.track);
          }
          return { ...p, stream: new MediaStream(currentStream.getTracks()) };
        }
        return p;
      }));
    };
    peer.setRemoteDescription(new RTCSessionDescription(incomingSignal)).then(() => {
      peer.createAnswer().then(answer => {
        peer.setLocalDescription(answer);
        socketRef.current.emit('returning-signal', { callerId, signal: answer });
      });
    });
    return peer;
  };

  // --- 3. UI Actions ---
  const toggleAudio = () => {
    if (streamRef.current) {
      const enabled = !audioEnabled;
      streamRef.current.getAudioTracks().forEach(t => t.enabled = enabled);
      setAudioEnabled(enabled);
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const enabled = !videoEnabled;
      streamRef.current.getVideoTracks().forEach(t => t.enabled = enabled);
      setVideoEnabled(enabled);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        Object.values(peersRef.current).forEach(peer => {
          const sender = peer.getSenders().find(s => s.track.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });
        if (userVideo.current) userVideo.current.srcObject = screenStream;
        screenTrack.onended = () => stopScreenShare();
        setIsScreenSharing(true);
        setScreenShareUserId('local');
        socketRef.current.emit('screen-share-status', { roomId: inviteLink, isSharing: true });
      } catch (e) { 
        if (e.name !== 'NotAllowedError') {
          console.error("Screen share error:", e);
        }
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    const videoTrack = streamRef.current.getVideoTracks()[0];
    Object.values(peersRef.current).forEach(peer => {
      const sender = peer.getSenders().find(s => s.track.kind === 'video');
      if (sender) sender.replaceTrack(videoTrack);
    });
    if (userVideo.current) userVideo.current.srcObject = streamRef.current;
    setIsScreenSharing(false);
    setScreenShareUserId(null);
    socketRef.current.emit('screen-share-status', { roomId: inviteLink, isSharing: false });
  };

  const handleToggleChat = () => {
    if (!isCreator) return;
    const newState = !chatEnabled;
    setChatEnabled(newState);
    socketRef.current.emit('chat-toggle', { roomId: inviteLink, enabled: newState });
    // Also persist to DB
    api.post(`/api/sessions/update/${inviteLink}`, { chatEnabled: newState }).catch(console.error);
  };

  const handleDownloadChat = () => {
    if (messages.length === 0) {
      alert("No messages to download.");
      return;
    }
    const chatContent = messages
      .map(m => `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.senderName}: ${m.content}`)
      .join('\n');
    
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Chat_History_${inviteLink}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendChatMessage = (e) => {
    e.preventDefault();
    if (!chatEnabled) {
      alert("Chat is currently disabled by the host.");
      return;
    }
    if (chatInput.trim()) {
      socketRef.current.emit('chat-message', { roomId: inviteLink, content: chatInput, senderName: userName });
      setChatInput('');
    }
  };

  const leaveMeeting = () => {
    if (window.confirm("Leave meeting?")) {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      socketRef.current?.disconnect();
      navigate('/dashboard');
    }
  };

  const handleGenerateMOM = async () => {
    if (isGeneratingMom) return;
    setIsGeneratingMom(true);
    try {
      const res = await api.post('/api/ai/mom', { sessionId: inviteLink });
      setMom(res.data.minutesOfMeeting);
      setShowMomModal(true);
    } catch (e) { 
      console.error("MOM error:", e);
      alert(e.response?.data?.message || e.response?.data?.error || "MOM generation failed."); 
    }
    finally { setIsGeneratingMom(false); }
  };

  const handleGetFeedback = async () => {
    if (isGeneratingFeedback) return;
    setIsGeneratingFeedback(true);
    try {
      const res = await api.post('/api/ai/feedback', { sessionId: inviteLink, userName });
      setFeedback(res.data.feedback);
      setShowFeedbackModal(true);
    } catch (e) { 
      console.error("Feedback error:", e);
      alert(e.response?.data?.message || e.response?.data?.error || "Feedback generation failed."); 
    }
    finally { setIsGeneratingFeedback(false); }
  };

  useEffect(() => {
    if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [messages]);

  // --- 4. AI Interview Logic ---
  const triggerBotResponse = async (currentMessages) => {
    if (botCount === 0) return;
    
    try {
      const res = await api.post('/api/ai/interview', {
        sessionId: inviteLink,
        transcript: currentMessages.slice(-10),
        botName: "AI Interviewer",
        isInterviewMode,
        jobDescription
      });
      if (res.data.response) {
        // Emit AI response to the entire room so it gets saved to DB and broadcasted
        socketRef.current.emit('chat-message', { 
          roomId: inviteLink, 
          content: res.data.response, 
          senderName: "AI Bot" 
        });
        
        // --- Added: Text-to-Speech (TTS) ---
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(res.data.response);
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          window.speechSynthesis.speak(utterance);
        }
      }
    } catch (e) { console.error('AI Bot error:', e); }
  };

  // Initial Bot Greeting
  useEffect(() => {
    if (botCount > 0 && isInterviewMode && messages.length === 0) {
      const timer = setTimeout(() => triggerBotResponse([]), 3000);
      return () => clearTimeout(timer);
    }
  }, [botCount, isInterviewMode, messages.length]);

  // Reactive Bot Response
  useEffect(() => {
    if (botCount > 0 && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      // Only respond to human messages, and prevent loops. ONLY trigger if WE sent the message to avoid duplicate bot triggers from multiple peers.
      if (!lastMsg.isAI && lastMsg.senderName !== "AI Bot" && lastMsg.senderId === socketRef.current?.id) {
        const timer = setTimeout(() => triggerBotResponse(messages), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [messages.length, botCount, isInterviewMode]);

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} onBack={() => navigate('/dashboard')} />;

  return (
    <div className={`flex h-screen bg-[#0f172a] text-white overflow-hidden ${isResizing ? 'select-none cursor-col-resize' : ''}`}>
      <div 
        style={{ width: `${sidebarWidth}px` }}
        className="bg-[#1e293b] border-r border-slate-700 flex flex-col shrink-0 relative"
      >
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">GDVerse</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-tighter">Meeting Link: {inviteLink}</p>
        </div>
        
        {/* Resize Handle */}
        <div 
          onMouseDown={startResizing}
          className={`absolute -right-[4px] top-0 bottom-0 w-[8px] cursor-col-resize z-[60] transition-colors ${isResizing ? 'bg-indigo-500/50' : 'hover:bg-indigo-500/30'}`}
        />
        <div className="flex p-2 gap-1 bg-slate-800/50 mx-4 mt-4 rounded-lg">
          <button onClick={() => setActiveTab('chat')} className={`flex-1 py-2 rounded-md text-sm transition-all ${activeTab === 'chat' ? 'bg-indigo-600 shadow-lg' : 'text-slate-400'}`}>Chat</button>
          <button onClick={() => setActiveTab('participants')} className={`flex-1 py-2 rounded-md text-sm transition-all ${activeTab === 'participants' ? 'bg-indigo-600 shadow-lg' : 'text-slate-400'}`}>People ({remotePeers.length + 1 + botCount})</button>
        </div>

        {activeTab === 'chat' && (
          <div className="flex justify-between items-center px-6 mt-4">
             <button 
                onClick={handleDownloadChat} 
                className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors"
                title="Download Chat History"
             >
                Download Chat
             </button>
             {isCreator && (
                <button 
                  onClick={handleToggleChat} 
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${chatEnabled ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'}`}
                >
                  Chat: {chatEnabled ? 'ON' : 'OFF'}
                </button>
             )}
          </div>
        )}
        <div className="flex-1 overflow-hidden flex flex-col mt-4">
          {activeTab === 'chat' ? (
            <div className="flex-1 flex flex-col">
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 space-y-4 pb-4 custom-scrollbar">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.senderId === socketRef.current?.id ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] text-slate-500 mb-1">{msg.senderName}</span>
                    <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${msg.senderName === 'AI Bot' ? 'bg-indigo-900/40 border border-indigo-500/30' : 'bg-slate-700'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={sendChatMessage} className="p-4 border-t border-slate-700">
                <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Message..." className="w-full bg-slate-700/50 border border-slate-600 rounded-full py-2 px-4 text-sm outline-none" />
              </form>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 space-y-3">
              <ParticipantItem name={userName} role="You" />
              {Array.from({ length: botCount }).map((_, i) => <ParticipantItem key={i} name={`AI Bot ${i+1}`} role="AI Assistant" isAI />)}
              {remotePeers.map(p => <ParticipantItem key={p.userId} name={p.name} role="Participant" />)}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col relative p-6">
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          {screenShareUserId ? (
            <div className="flex flex-col w-full h-full gap-4 pb-20">
               <div className="flex-1 w-full bg-black rounded-3xl overflow-hidden flex items-center justify-center border border-slate-700">
                  {screenShareUserId === 'local' ? (
                     <VideoTile stream={localStream} name="You (Screen)" isLocal videoEnabled={videoEnabled} isScreenSharing={true} />
                  ) : (
                     remotePeers.find(p => p.userId === screenShareUserId) && 
                     <VideoTile stream={remotePeers.find(p => p.userId === screenShareUserId).stream} name={remotePeers.find(p => p.userId === screenShareUserId).name} isScreenSharing={true} />
                  )}
               </div>
               <div className="flex h-32 gap-4 overflow-x-auto shrink-0 custom-scrollbar">
                  {screenShareUserId !== 'local' && (
                    <div className="w-48 shrink-0">
                      <VideoTile stream={localStream} name="You" isLocal videoEnabled={videoEnabled} />
                    </div>
                  )}
                  {remotePeers.filter(p => p.userId !== screenShareUserId).map(peer => (
                    <div className="w-48 shrink-0" key={peer.userId}>
                      <VideoTile stream={peer.stream} name={peer.name} />
                    </div>
                  ))}
               </div>
            </div>
          ) : (
            <div className={`grid gap-4 w-full h-full max-w-7xl mx-auto ${remotePeers.length === 0 ? 'grid-cols-1 max-w-3xl' : remotePeers.length <= 3 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              <VideoTile stream={localStream} name="You" isLocal videoEnabled={videoEnabled} />
              {remotePeers.map(peer => <VideoTile key={peer.userId} stream={peer.stream} name={peer.name} />)}
            </div>
          )}
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl px-8 py-4 rounded-full border border-slate-700 shadow-2xl z-50">
          <ControlButton active={audioEnabled} onClick={toggleAudio} icon={audioEnabled ? "mic" : "mic_off"} />
          <ControlButton active={videoEnabled} onClick={toggleVideo} icon={videoEnabled ? "videocam" : "videocam_off"} />
          <ControlButton active={isScreenSharing} onClick={toggleScreenShare} icon="screen_share" color="indigo" />
          <div className="w-[1px] h-8 bg-slate-700 mx-2"></div>
          <ControlButton onClick={handleGenerateMOM} icon="auto_awesome" color="purple" loading={isGeneratingMom} />
          {isInterviewMode && <ControlButton onClick={handleGetFeedback} icon="analytics" color="green" loading={isGeneratingFeedback} />}
          <ControlButton onClick={leaveMeeting} icon="call_end" color="red" />
        </div>
      </div>

      {showMomModal && <MOMModal content={mom} onClose={() => setShowMomModal(false)} sessionId={inviteLink} />}
      {showFeedbackModal && <FeedbackModal content={feedback} onClose={() => setShowFeedbackModal(false)} sessionId={inviteLink} />}
    </div>
  );
}

function VideoTile({ stream, name, isLocal, videoEnabled = true, isScreenSharing = false }) {
  const videoRef = useRef();
  const hasVideo = stream && stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled;
  
  useEffect(() => { 
    if (videoRef.current && hasVideo) {
      videoRef.current.srcObject = stream;
      videoRef.current.volume = 1;
      videoRef.current.play().catch(e => console.warn("Video play failed:", e));
    } 
  }, [stream, hasVideo]);
  
  return (
    <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-900 border border-slate-700 group flex items-center justify-center shadow-2xl transition-all hover:border-indigo-500/30">
      {!hasVideo ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
           <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center text-3xl mb-4 border border-indigo-500/20">
              {name.includes("You") ? "👤" : "👥"}
           </div>
           <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No Camera Detected</p>
        </div>
      ) : (
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted={isLocal}
          className={`w-full h-full ${isScreenSharing ? 'object-contain bg-black' : 'object-cover'} ${isLocal && !isScreenSharing ? 'scale-x-[-1]' : ''}`} 
        />
      )}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
        <span className="text-[10px] font-black uppercase tracking-widest">{name}</span>
      </div>
    </div>
  );
}

function ParticipantItem({ name, role, isAI }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${isAI ? 'bg-indigo-900/20 border-indigo-500/20' : 'bg-slate-800/40 border-slate-700/50'}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isAI ? 'bg-indigo-600' : 'bg-slate-700'}`}>{isAI ? '🤖' : name[0]}</div>
      <div><p className={`text-sm font-semibold ${isAI ? 'text-indigo-300' : 'text-slate-200'}`}>{name}</p><p className="text-[10px] text-slate-500 uppercase">{role}</p></div>
    </div>
  );
}

function ControlButton({ active = true, onClick, icon, color = "slate", loading }) {
  const colors = { slate: active ? 'bg-slate-800' : 'bg-red-600', indigo: 'bg-indigo-600', yellow: active ? 'bg-yellow-500' : 'bg-slate-800', purple: 'bg-purple-600', red: 'bg-red-600', green: 'bg-green-600' };
  return (
    <button onClick={onClick} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${colors[color]} disabled:opacity-50`}>
      {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span className="material-icons text-xl">{icon}</span>}
    </button>
  );
}

function LoadingScreen() { return <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a]"><div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6" /><h2 className="text-xl font-bold text-white">Starting Meeting...</h2></div>; }
function ErrorScreen({ message, onBack }) { return <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-6"><div className="bg-slate-800 p-10 rounded-3xl border border-slate-700 text-center"><h2 className="text-2xl font-bold mb-4">Error</h2><p className="text-slate-400 mb-8">{message}</p><button onClick={onBack} className="w-full py-3 bg-indigo-600 rounded-xl font-bold">Back</button></div></div>; }

function MOMModal({ content, onClose, sessionId }) {
  const downloadAsPDF = () => {
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(content, 180);
    doc.setFontSize(20); doc.text("Meeting Summary", 15, 20);
    doc.setFontSize(10); doc.text(`Meeting Link: ${sessionId}`, 15, 30);
    doc.setFontSize(12); doc.text(splitText, 15, 50);
    doc.save(`Summary_${sessionId}.pdf`);
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-700">
        <div className="p-8 border-b border-slate-700 flex justify-between items-center"><h3 className="text-2xl font-bold">Meeting Summary</h3><div className="flex gap-4"><button onClick={downloadAsPDF} className="px-4 py-2 bg-indigo-600 rounded-full text-xs font-bold">PDF</button><button onClick={onClose} className="material-icons text-slate-400">close</button></div></div>
        <div className="p-8 overflow-y-auto flex-1 text-slate-300"><pre className="whitespace-pre-wrap font-sans text-sm">{content}</pre></div>
      </div>
    </div>
  );
}

function FeedbackModal({ content, onClose, sessionId }) {
  const downloadAsPDF = () => {
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(content, 180);
    doc.setFontSize(20); doc.text("Performance Assessment", 15, 20);
    doc.setFontSize(10); doc.text(`Meeting: ${sessionId}`, 15, 30);
    doc.setFontSize(12); doc.text(splitText, 15, 50);
    doc.save(`Feedback_${sessionId}.pdf`);
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-700">
        <div className="p-8 border-b border-slate-700 flex justify-between items-center"><h3 className="text-2xl font-bold">AI Feedback</h3><div className="flex gap-4"><button onClick={downloadAsPDF} className="px-4 py-2 bg-green-600 rounded-full text-xs font-bold">DOWNLOAD REPORT</button><button onClick={onClose} className="material-icons text-slate-400">close</button></div></div>
        <div className="p-8 overflow-y-auto flex-1 text-slate-300"><pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{content}</pre></div>
      </div>
    </div>
  );
}

export default GDSessionRoom;
