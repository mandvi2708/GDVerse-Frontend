import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Peer from 'simple-peer';
import api, { getBaseURL } from '../api';

function GDSessionRoom() {
  const { inviteLink } = useParams();
  const navigate = useNavigate();
  const [peers, setPeers] = useState([]); // Stores { peerID, peer, remoteStream, name }
  const [localStream, setLocalStream] = useState();
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [participants, setParticipants] = useState([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [mom, setMom] = useState('');
  const [showMomModal, setShowMomModal] = useState(false);
  const [isGeneratingMom, setIsGeneratingMom] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [botCount, setBotCount] = useState(0);

  const userVideo = useRef();
  const peersRef = useRef([]); // Stores { peerID, peer, name }
  const chatContainerRef = useRef();
  const socketRef = useRef();
  const streamRef = useRef();

  // Get current user info
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userName = user?.name || 'Anonymous';

  // Auth Guard
  useEffect(() => {
    if (!user) {
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      navigate('/login');
    }
  }, [user, navigate]);

  // 1. Initial Socket & Room Setup (Once)
  useEffect(() => {
    if (!user) return;
    
    socketRef.current = io(getBaseURL());
    const socket = socketRef.current;

    const setupSocket = async () => {
      const isTimeReady = await checkSessionStatus();
      if (!isTimeReady) return;

      socket.emit('join-room', { roomId: inviteLink, name: userName });

      socket.on('all-users', (users) => {
        console.log('📡 [Signal] Existing users:', users);
        const newPeers = [];
        users.forEach(({ userId, name }) => {
          const peer = createPeer(userId, socket.id, streamRef.current, name);
          peersRef.current.push({ peerID: userId, peer, name });
          newPeers.push({ peerID: userId, peer, remoteStream: null, name });
        });
        setPeers(newPeers);
        setIsLoading(false);
      });

      socket.on('user-joined', ({ userId, name }) => {
        console.log('📡 [Signal] New participant joined:', name);
        const peer = addPeer(null, userId, streamRef.current, name);
        peersRef.current.push({ peerID: userId, peer, name });
        setPeers(prev => [...prev, { peerID: userId, peer, remoteStream: null, name }]);
      });

      socket.on('signal', ({ senderId, signal }) => {
        const item = peersRef.current.find(p => p.peerID === senderId);
        if (item) item.peer.signal(signal);
      });

      socket.on('chat-message', (data) => {
        setMessages(prev => [...prev, data]);
      });

      socket.on('user-left', id => {
        console.log('📡 [Signal] Participant left:', id);
        const peerObj = peersRef.current.find(p => p.peerID === id);
        if (peerObj) {
          try { peerObj.peer.destroy(); } catch (e) { console.error(e); }
        }
        peersRef.current = peersRef.current.filter(p => p.peerID !== id);
        setPeers(prev => prev.filter(p => p.peerID !== id));
      });
    };

    // 2. Media Initialization
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      streamRef.current = stream;
      setLocalStream(stream);
      if (userVideo.current) userVideo.current.srcObject = stream;
      setupSocket();
    }).catch(err => {
      console.error('❌ [Media] Stream error:', err);
      setError('Could not access media devices. Please check permissions.');
      setIsLoading(false);
    });

    // 3. Tab Closure Cleanup
    const handleUnload = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      socket.disconnect();
      handleUnload();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [inviteLink, userName, user, navigate]);

  // 4. Transcription Lifecycle (Separate from Socket)
  useEffect(() => {
    if (!socketRef.current || !isTranscribing) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const lastResultIndex = event.results.length - 1;
      const transcript = event.results[lastResultIndex][0].transcript;
      if (transcript.trim()) {
        socketRef.current.emit('transcript-update', {
          roomId: inviteLink,
          sender: userName,
          text: transcript
        });
      }
    };

    recognition.onend = () => {
      if (isTranscribing) {
        try { recognition.start(); } catch (e) { /* Already started or error */ }
      }
    };

    try { recognition.start(); } catch (e) { console.error(e); }

    return () => recognition.stop();
  }, [isTranscribing, inviteLink, userName]);

  const checkSessionStatus = async () => {
    try {
      const res = await api.get(`/api/sessions/join/${inviteLink}`);
      const { date, time, aiCount } = res.data;
      setBotCount(aiCount || 0);

      const scheduledTime = new Date(`${date}T${time}`).getTime();
      const now = new Date().getTime();

      if (now < scheduledTime) {
        setError(`This session is scheduled for ${date} at ${time}. Please join at that time!`);
        setIsLoading(false);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Session check failed:', err);
      return true;
    }
  };


  // Bot Activity Simulation (Intelligent)
  useEffect(() => {
    if (botCount > 0) {
      const botInterval = setInterval(async () => {
        // Only talk if there's some human activity
        const humanMessages = messages.filter(m => !m.isAI);
        if (humanMessages.length > 0 && Math.random() > 0.6) {
          const botId = Math.floor(Math.random() * botCount) + 1;
          const botName = `AI Bot ${botId}`;
          
          try {
            const res = await api.post('/api/ai/bot-response', {
              transcript: messages.slice(-15),
              botName
            });

            if (res.data.response) {
              const aiMessage = {
                sender: botName,
                content: res.data.response,
                timestamp: new Date().toISOString(),
                senderName: botName,
                isAI: true
              };
              
              setMessages(prev => [...prev, aiMessage]);
            }
          } catch (err) {
            console.error("AI Bot failed to respond:", err);
          }
        }
      }, 30000); // Check every 30 seconds

      return () => clearInterval(botInterval);
    }
  }, [botCount, messages]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const peerConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ]
  };

  const createPeer = (userToSignal, callerID, stream, name) => {
    const peer = new Peer({ 
      initiator: true, 
      trickle: false, 
      stream,
      config: peerConfig
    });
    peer.on('signal', signal => {
      socketRef.current.emit('signal', { targetId: userToSignal, signal });
    });
    peer.on('stream', remoteStream => {
      console.log(`📡 [Stream] Received remote stream from: ${name}`);
      setPeers(prev => prev.map(p => p.peerID === userToSignal ? { ...p, remoteStream, name } : p));
    });
    return peer;
  };

  const addPeer = (incomingSignal, callerID, stream, name) => {
    const peer = new Peer({ 
      initiator: false, 
      trickle: false, 
      stream,
      config: peerConfig
    });
    peer.on('signal', signal => {
      socketRef.current.emit('signal', { targetId: callerID, signal });
    });
    peer.on('stream', remoteStream => {
      console.log(`📡 [Stream] Received remote stream from (passive): ${name}`);
      setPeers(prev => prev.map(p => p.peerID === callerID ? { ...p, remoteStream, name } : p));
    });
    if (incomingSignal) peer.signal(incomingSignal);
    return peer;
  };

  const toggleAudio = () => {
    if (localStream) {
      const enabled = !audioEnabled;
      localStream.getAudioTracks().forEach(track => track.enabled = enabled);
      setAudioEnabled(enabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const enabled = !videoEnabled;
      localStream.getVideoTracks().forEach(track => track.enabled = enabled);
      setVideoEnabled(enabled);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        peersRef.current.forEach(({ peer }) => {
          const sender = peer._pc.getSenders().find(s => s.track.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });

        if (userVideo.current) userVideo.current.srcObject = screenStream;

        screenTrack.onended = () => {
          peersRef.current.forEach(({ peer }) => {
            const sender = peer._pc.getSenders().find(s => s.track.kind === 'video');
            if (sender) sender.replaceTrack(localStream.getVideoTracks()[0]);
          });
          if (userVideo.current) userVideo.current.srcObject = localStream;
          setIsScreenSharing(false);
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error('Screen sharing failed', err);
      }
    } else {
      peersRef.current.forEach(({ peer }) => {
        const sender = peer._pc.getSenders().find(s => s.track.kind === 'video');
        if (sender) sender.replaceTrack(localStream.getVideoTracks()[0]);
      });
      if (userVideo.current) userVideo.current.srcObject = localStream;
      setIsScreenSharing(false);
    }
  };

  const sendChatMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      socketRef.current.emit('chat-message', {
        roomId: inviteLink,
        content: chatInput,
        senderName: userName
      });
      setChatInput('');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  const leaveMeeting = () => {
    if (window.confirm("Are you sure you want to leave the meeting?")) {
      // 1. Stop all tracks immediately
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log(`📡 [Media] Stopped track: ${track.kind}`);
        });
      }
      
      // 2. Disconnect socket
      socketRef.current?.disconnect();
      
      // 3. Navigate away
      navigate('/dashboard');
    }
  };

  const handleGenerateMOM = async () => {
    setIsGeneratingMom(true);
    try {
      const response = await fetch(`${getBaseURL()}/api/sessions/join/${inviteLink}`);
      const sessionData = await response.json();
      
      if (sessionData && sessionData._id) {
        const genResponse = await fetch(`${getBaseURL()}/api/ai/generate-mom/${sessionData._id}`, {
          method: 'POST'
        });
        const genData = await genResponse.json();
        setMom(genData.minutesOfMeeting);
        setShowMomModal(true);
      }
    } catch (err) {
      console.error("Error generating MOM:", err);
      alert("Failed to generate MOM. Make sure transcriptions were captured.");
    } finally {
      setIsGeneratingMom(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-6">
        <div className="bg-slate-800 p-10 rounded-3xl shadow-2xl border border-slate-700 max-w-md w-full text-center animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-4">Cannot Join Room</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">{error}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] flex-col gap-6">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">Preparing your session...</h2>
          <p className="text-slate-500 mt-2">Checking camera and microphone permissions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0f172a] text-white overflow-hidden font-sans">
      {/* Sidebar for Participants and Chat */}
      <div className="w-80 bg-[#1e293b] border-r border-slate-700 flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">GDVerse</h1>
          <p className="text-xs text-slate-400 mt-1">Session ID: {inviteLink}</p>
        </div>
        
        <div className="flex p-2 gap-1 bg-slate-800/50 mx-4 mt-4 rounded-lg">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${activeTab === 'participants' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            People ({peers.length + 1 + botCount})
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col mt-4">
          {activeTab === 'chat' ? (
            <div className="flex-1 flex flex-col">
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 space-y-4 pb-4 custom-scrollbar">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 px-6 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-sm">Messages sent here are visible to everyone in the session.</p>
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.senderId === socketRef.current?.id ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{msg.senderId === socketRef.current?.id ? 'You' : msg.senderName}</span>
                      <span className="text-[9px] text-slate-500">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${msg.senderId === socketRef.current?.id ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-700 text-slate-100 rounded-tl-none'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={sendChatMessage} className="p-4 bg-slate-800/30 border-t border-slate-700">
                <div className="relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Send a message..."
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-full py-2.5 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  <button type="submit" className="absolute right-1 top-1 bottom-1 w-10 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
                <div className="space-y-4">
                  {/* Local User */}
                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold">
                      {userName[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{userName} (You)</p>
                      <p className="text-xs text-slate-400">Organizer</p>
                    </div>
                  </div>

                  {/* AI Bots */}
                  {Array.from({ length: botCount }).map((_, i) => (
                    <div key={`bot-${i}`} className="flex items-center gap-3 p-3 bg-indigo-900/20 rounded-xl border border-indigo-500/10">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xl">
                        🤖
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-indigo-300">AI Bot {i + 1}</p>
                        <p className="text-xs text-indigo-400/60 font-medium uppercase tracking-tighter">Active AI Participant</p>
                      </div>
                    </div>
                  ))}

                  {/* Other Peers */}
                  {peers.map((p) => (
                    <div key={p.peerID} className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/30 border border-slate-700/50">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-sm">
                        {p.name ? p.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">{p.name || 'Joining...'}</p>
                        <p className="text-[10px] text-slate-500">Participant</p>
                      </div>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        
        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          <button 
            onClick={copyLink}
            className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all ${copied ? 'bg-green-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'}`}
          >
            {copied ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            )}
            {copied ? 'Copied Link!' : 'Copy Invite Link'}
          </button>
        </div>
      </div>

      {/* Main Video Section */}
      <div className="flex-1 flex flex-col relative">
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <div className={`grid gap-6 ${
            peers.length === 0 ? 'grid-cols-1 max-w-4xl mx-auto h-full items-center' : 
            peers.length === 1 ? 'grid-cols-1 md:grid-cols-2' : 
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {/* Local User Video */}
            <div className="relative group aspect-video rounded-2xl overflow-hidden bg-slate-800 shadow-2xl border border-slate-700 transition-all hover:scale-[1.02]">
              <video ref={userVideo} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-indigo-600/80 backdrop-blur-md rounded text-[10px] font-bold uppercase tracking-widest">You</span>
                  {!videoEnabled && <span className="px-2 py-1 bg-red-600/80 backdrop-blur-md rounded text-[10px] font-bold uppercase tracking-widest">Camera Off</span>}
                </div>
              </div>
              {!videoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                  <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-3xl font-bold text-slate-400 border border-slate-700">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
            </div>

            {/* Remote Participants Video */}
            {peers.map((peer) => (
              <Video key={peer.peerID} peerID={peer.peerID} remoteStream={peer.remoteStream} name={peer.name} />
            ))}
          </div>
        </div>

        {/* Floating Controls Bar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl px-8 py-4 rounded-full border border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-20">
          <button
            onClick={toggleAudio}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${audioEnabled ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]'}`}
          >
            {audioEnabled ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>

          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${videoEnabled ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]'}`}
          >
            {videoEnabled ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
              </svg>
            )}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isScreenSharing ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>

          <div className="w-[1px] h-8 bg-slate-700 mx-2"></div>

          <button
            onClick={() => setIsTranscribing(!isTranscribing)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isTranscribing ? 'bg-yellow-500 text-white shadow-[0_0_20px_rgba(234,179,8,0.4)]' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
            title="AI Transcription"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>

          <button
            onClick={handleGenerateMOM}
            disabled={isGeneratingMom}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] disabled:opacity-50`}
            title="Generate AI Minutes"
          >
            {isGeneratingMom ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
          </button>

          <button
            onClick={leaveMeeting}
            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)]"
            title="Leave Meeting"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* MOM Modal (Already fairly styled, but keeping it for completeness) */}
      {showMomModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-700 animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-700 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-white">AI Minutes of Meeting</h3>
                <p className="text-sm text-slate-400 mt-1">Automatically generated from the session transcript</p>
              </div>
              <button onClick={() => setShowMomModal(false)} className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-8 overflow-y-auto flex-1 text-slate-300">
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50">
                  {mom}
                </pre>
              </div>
            </div>
            <div className="p-8 border-t border-slate-700 flex justify-end gap-4">
              <button
                onClick={() => {
                  const blob = new Blob([mom], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `MOM_${inviteLink}.txt`;
                  a.click();
                }}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
              >
                Download Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Video({ peerID, remoteStream, name }) {
  const ref = useRef();

  useEffect(() => {
    if (ref.current && remoteStream) {
      console.log(`🎥 [Video] Assigning stream to participant: ${name}`);
      ref.current.srcObject = remoteStream;
      
      // Auto-play handle for some browsers
      const playPromise = ref.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("Autoplay was prevented. User might need to interact first.", error);
        });
      }
    }
  }, [remoteStream, name]);

  return (
    <div className="relative group aspect-video rounded-2xl overflow-hidden bg-slate-800 shadow-2xl border border-slate-700 transition-all hover:scale-[1.02]">
      <video 
        ref={ref} 
        autoPlay 
        playsInline 
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(1)' }} // Remote video should not be mirrored
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-slate-900/80 backdrop-blur-md rounded text-[10px] font-bold uppercase tracking-widest">{name || 'Participant'}</span>
        </div>
      </div>
      {!remoteStream && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Connecting Stream...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default GDSessionRoom;
