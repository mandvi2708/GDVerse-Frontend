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
      try {
        // A. Check Session Validity
        const statusRes = await api.get(`/api/sessions/join/${inviteLink}`);
        setBotCount(statusRes.data.aiCount || 0);
        setIsInterviewMode(statusRes.data.isInterviewMode || false);
        setJobDescription(statusRes.data.jobDescription || "");

        // B. Get Local Media
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        setLocalStream(stream);
        if (userVideo.current) userVideo.current.srcObject = stream;

        // C. Initialize Socket
        socketRef.current = io(getBaseURL(), {
          transports: ['polling', 'websocket'],
          secure: true
        });

        const socket = socketRef.current;
        const normalizedRoomId = inviteLink.trim().toLowerCase();

        socket.on('connect', () => {
          socket.emit('join-room', { roomId: normalizedRoomId, name: userName });
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
        });

        setIsLoading(false);
      } catch (err) {
        setError('Failed to initialize meeting. Please check camera permissions.');
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

  // --- 2. Peer Connection Logic ---
  const createPeer = (userToSignal, callerId, stream, name) => {
    const peer = new RTCPeerConnection(ICE_SERVERS);
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
    peer.onicecandidate = e => {
      if (e.candidate) socketRef.current.emit('ice-candidate', { targetId: userToSignal, candidate: e.candidate });
    };
    peer.ontrack = e => {
      setRemotePeers(prev => prev.map(p => p.userId === userToSignal ? { ...p, stream: e.streams[0] } : p));
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
      setRemotePeers(prev => prev.map(p => p.userId === callerId ? { ...p, stream: e.streams[0] } : p));
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
      } catch (e) { console.error(e); }
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
  };

  const sendChatMessage = (e) => {
    e.preventDefault();
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
        transcript: currentMessages.slice(-10),
        botName: "AI Interviewer",
        isInterviewMode,
        jobDescription
      });
      if (res.data.response) {
        const botMsg = { 
          senderName: "AI Bot", 
          content: res.data.response, 
          timestamp: new Date(), 
          isAI: true 
        };
        setMessages(prev => [...prev, botMsg]);
        
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
      // Only respond to human messages, and prevent loops
      if (!lastMsg.isAI && lastMsg.senderName !== "AI Bot") {
        const timer = setTimeout(() => triggerBotResponse(messages), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [messages.length, botCount, isInterviewMode]);

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} onBack={() => navigate('/dashboard')} />;

  return (
    <div className="flex h-screen bg-[#0f172a] text-white overflow-hidden">
      <div className="w-85 bg-[#1e293b] border-r border-slate-700 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">GDVerse</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-tighter">Session ID: {inviteLink}</p>
        </div>
        <div className="flex p-2 gap-1 bg-slate-800/50 mx-4 mt-4 rounded-lg">
          <button onClick={() => setActiveTab('chat')} className={`flex-1 py-2 rounded-md text-sm ${activeTab === 'chat' ? 'bg-indigo-600' : 'text-slate-400'}`}>Chat</button>
          <button onClick={() => setActiveTab('participants')} className={`flex-1 py-2 rounded-md text-sm ${activeTab === 'participants' ? 'bg-indigo-600' : 'text-slate-400'}`}>People ({remotePeers.length + 1 + botCount})</button>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col mt-4">
          {activeTab === 'chat' ? (
            <div className="flex-1 flex flex-col">
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 space-y-4 pb-4 custom-scrollbar">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.senderId === socketRef.current?.id ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] text-slate-500 mb-1">{msg.senderName}</span>
                    <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${msg.isAI ? 'bg-indigo-900/40 border border-indigo-500/30' : 'bg-slate-700'}`}>
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
          <div className={`grid gap-4 w-full h-full max-w-7xl mx-auto ${remotePeers.length === 0 ? 'grid-cols-1 max-w-3xl' : 'grid-cols-2'}`}>
            <VideoTile stream={localStream} name="You" isLocal videoEnabled={videoEnabled} />
            {remotePeers.map(peer => <VideoTile key={peer.userId} stream={peer.stream} name={peer.name} />)}
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl px-8 py-4 rounded-full border border-slate-700 shadow-2xl z-50">
          <ControlButton active={audioEnabled} onClick={toggleAudio} icon={audioEnabled ? "mic" : "mic_off"} />
          <ControlButton active={videoEnabled} onClick={toggleVideo} icon={videoEnabled ? "videocam" : "videocam_off"} />
          <ControlButton active={isScreenSharing} onClick={toggleScreenShare} icon="screen_share" color="indigo" />
          <div className="w-[1px] h-8 bg-slate-700 mx-2"></div>
          <ControlButton active={isTranscribing} onClick={() => setIsTranscribing(!isTranscribing)} icon="description" color="yellow" />
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

function VideoTile({ stream, name, isLocal, videoEnabled = true }) {
  const videoRef = useRef();
  useEffect(() => { if (videoRef.current && stream) videoRef.current.srcObject = stream; }, [stream]);
  return (
    <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-800 border border-slate-700 group">
      <video ref={videoRef} autoPlay playsInline muted={isLocal} className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`} />
      <div className="absolute bottom-4 left-4"><span className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[10px] font-bold uppercase">{name}</span></div>
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

function LoadingScreen() { return <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a]"><div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6" /><h2 className="text-xl font-bold text-white">Preparing Session...</h2></div>; }
function ErrorScreen({ message, onBack }) { return <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-6"><div className="bg-slate-800 p-10 rounded-3xl border border-slate-700 text-center"><h2 className="text-2xl font-bold mb-4">Error</h2><p className="text-slate-400 mb-8">{message}</p><button onClick={onBack} className="w-full py-3 bg-indigo-600 rounded-xl font-bold">Back</button></div></div>; }

function MOMModal({ content, onClose, sessionId }) {
  const downloadAsPDF = () => {
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(content, 180);
    doc.setFontSize(20); doc.text("Minutes of Meeting", 15, 20);
    doc.setFontSize(10); doc.text(`Session: ${sessionId}`, 15, 30);
    doc.setFontSize(12); doc.text(splitText, 15, 50);
    doc.save(`MOM_${sessionId}.pdf`);
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-700">
        <div className="p-8 border-b border-slate-700 flex justify-between items-center"><h3 className="text-2xl font-bold">AI MOM</h3><div className="flex gap-4"><button onClick={downloadAsPDF} className="px-4 py-2 bg-indigo-600 rounded-full text-xs font-bold">PDF</button><button onClick={onClose} className="material-icons text-slate-400">close</button></div></div>
        <div className="p-8 overflow-y-auto flex-1 text-slate-300"><pre className="whitespace-pre-wrap font-sans text-sm">{content}</pre></div>
      </div>
    </div>
  );
}

function FeedbackModal({ content, onClose, sessionId }) {
  const downloadAsPDF = () => {
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(content, 180);
    doc.setFontSize(20); doc.text("Interview Assessment Report", 15, 20);
    doc.setFontSize(10); doc.text(`Session: ${sessionId}`, 15, 30);
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
