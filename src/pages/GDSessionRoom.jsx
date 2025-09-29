import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import Peer from 'simple-peer';

const socket = io(import.meta.env.VITE_BACKEND_URL);

function GDSessionRoom() {
  const { inviteLink } = useParams();
  const [peers, setPeers] = useState([]); // Stores { peerID, peer, remoteStream }
  const [localStream, setLocalStream] = useState(); // Renamed for clarity
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState('participants');
  const [participants, setParticipants] = useState([{ id: 'you', name: 'You' }]);

  const userVideo = useRef();
  const peersRef = useRef([]);
  const chatContainerRef = useRef();

  useEffect(() => {
    let mediaStream; // Declare a variable to hold the stream

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      mediaStream = stream; // Assign the stream to the variable
      setLocalStream(stream);
      if (userVideo.current) userVideo.current.srcObject = stream;

      socket.emit('join-room', inviteLink);

      socket.on('user-joined', userId => {
        const peer = createPeer(userId, socket.id, stream);
        peersRef.current.push({ peerID: userId, peer });
        setPeers(prevPeers => [...prevPeers, { peerID: userId, peer, remoteStream: null }]);
        setParticipants(prev => [...prev, { id: userId, name: `User ${userId.slice(0, 4)}` }]);
      });

      socket.on('signal', ({ senderId, signal }) => {
        const item = peersRef.current.find(p => p.peerID === senderId);
        if (item) {
          item.peer.signal(signal);
        } else {
          const peer = addPeer(signal, senderId, stream);
          peersRef.current.push({ peerID: senderId, peer });
          setPeers(prevPeers => [...prevPeers, { peerID: senderId, peer, remoteStream: null }]);
        }
      });

      socket.on('user-left', id => {
        const peerObj = peersRef.current.find(p => p.peerID === id);
        if (peerObj) peerObj.peer.destroy();
        peersRef.current = peersRef.current.filter(p => p.peerID !== id);
        setPeers(prevPeers => prevPeers.filter(p => p.peerID !== id));
        setParticipants(prev => prev.filter(p => p.id !== id));
      });

      socket.on('chat-message', (data) => {
        setMessages(prev => [...prev, data]);
      });
    });

    return () => {
      socket.disconnect();
      mediaStream?.getTracks().forEach(track => track.stop()); // Use mediaStream for cleanup
    };
  }, []); // Empty dependency array to run only once on mount

  useEffect(() => {
    // Auto-scroll chat to bottom when new messages arrive
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

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

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on('signal', signal => {
      socket.emit('signal', { targetId: userToSignal, signal });
    });
    peer.on('stream', remoteStream => {
      setPeers(prevPeers =>
        prevPeers.map(p => (p.peerID === userToSignal ? { ...p, remoteStream } : p))
      );
    });
    return peer;
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on('signal', signal => {
      socket.emit('signal', { targetId: callerID, signal });
    });
    peer.on('stream', remoteStream => {
      setPeers(prevPeers =>
        prevPeers.map(p => (p.peerID === callerID ? { ...p, remoteStream } : p))
      );
    });
    peer.signal(incomingSignal);
    return peer;
  };

  const toggleAudio = () => {
    localStream.getAudioTracks()[0].enabled = !audioEnabled;
    setAudioEnabled(!audioEnabled);
  };

  const toggleVideo = () => {
    localStream.getVideoTracks()[0].enabled = !videoEnabled;
    setVideoEnabled(!videoEnabled);
  };

  const sendChatMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      const msg = { sender: socket.id, content: chatInput };
      socket.emit('chat-message', msg);
      setMessages(prev => [...prev, msg]);
      setChatInput('');
    }
  };

  const leaveMeeting = () => {
    localStream?.getTracks().forEach(track => track.stop());
    socket.disconnect();
    window.location.href = '/dashboard';
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Main Video Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <h2 className="text-xl font-semibold ml-2">GD Session: {inviteLink}</h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">
              {participants.length} {participants.length === 1 ? 'participant' : 'participants'}
            </span>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 overflow-auto">
          {/* Local Video */}
          <div className="relative rounded-xl overflow-hidden bg-gray-800 aspect-video">
            <video 
              ref={userVideo} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <p className="text-sm font-medium">You {!videoEnabled && '(Camera off)'}</p>
              <div className="flex space-x-2 mt-1">
                {!audioEnabled && (
                  <span className="text-xs bg-red-500 px-2 py-1 rounded-full">Muted</span>
                )}
              </div>
            </div>
          </div>

          {/* Remote Videos */}
          {peers.map(({ peerID, remoteStream }) => (
            <Video key={peerID} peerID={peerID} remoteStream={remoteStream} />
          ))}
        </div>

        {/* Control Bar */}
        <div className="bg-gray-800 p-4 flex items-center justify-center space-x-6">
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full ${audioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'} transition-all`}
            aria-label={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {audioEnabled ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${videoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'} transition-all`}
            aria-label={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {videoEnabled ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-full ${isScreenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'} transition-all`}
            aria-label={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>

          <button
            onClick={leaveMeeting}
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-all"
            aria-label="Leave meeting"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
        <div className="flex border-b border-gray-700">
          <button
            className={`flex-1 py-3 font-medium ${activeTab === 'participants' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
            onClick={() => setActiveTab('participants')}
          >
            Participants
          </button>
          <button
            className={`flex-1 py-3 font-medium ${activeTab === 'chat' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
        </div>

        {activeTab === 'participants' ? (
          <div className="flex-1 overflow-auto p-4">
            <h3 className="text-lg font-semibold mb-4">Participants ({participants.length})</h3>
            <ul className="space-y-3">
              {participants.map((participant) => (
                <li key={participant.id} className="flex items-center space-x-3 p-2 hover:bg-gray-700 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium">
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{participant.name}</p>
                    <p className="text-xs text-gray-400">{participant.id === 'you' ? 'You' : participant.id.slice(0, 8)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-auto p-4 space-y-4"
            >
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.sender === socket.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs rounded-lg px-4 py-2 ${msg.sender === socket.id ? 'bg-blue-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {msg.sender === socket.id ? 'You' : 'Peer'} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={sendChatMessage} className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function Video({ peerID, remoteStream }) {
  const ref = useRef();

  useEffect(() => {
    if (ref.current && remoteStream) {
      ref.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-gray-800 aspect-video">
      <video 
        ref={ref} 
        autoPlay 
        playsInline 
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <p className="text-sm font-medium">User {peerID.slice(0, 4)}</p>
      </div>
    </div>
  );
}

export default GDSessionRoom;
