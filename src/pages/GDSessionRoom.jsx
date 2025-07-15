import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import Peer from 'simple-peer';

const socket = io(import.meta.env.VITE_BACKEND_URL); // ✅ Replaced localhost with env variable

function GDSessionRoom() {
  const { inviteLink } = useParams();
  const [peers, setPeers] = useState([]);
  const [stream, setStream] = useState();
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  const userVideo = useRef();
  const peersRef = useRef([]);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(currentStream => {
      setStream(currentStream);
      if (userVideo.current) userVideo.current.srcObject = currentStream;

      socket.emit('join-room', inviteLink);

      socket.on('user-joined', userId => {
        const peer = createPeer(userId, socket.id, currentStream);
        peersRef.current.push({ peerID: userId, peer });
        setPeers(users => [...users, peer]);
      });

      socket.on('signal', ({ senderId, signal }) => {
        const item = peersRef.current.find(p => p.peerID === senderId);
        if (item) {
          item.peer.signal(signal);
        } else {
          const peer = addPeer(signal, senderId, currentStream);
          peersRef.current.push({ peerID: senderId, peer });
          setPeers(users => [...users, peer]);
        }
      });

      socket.on('user-left', id => {
        const peerObj = peersRef.current.find(p => p.peerID === id);
        if (peerObj) peerObj.peer.destroy();
        peersRef.current = peersRef.current.filter(p => p.peerID !== id);
        setPeers(peers => peers.filter(p => p.peerID !== id));
      });

      socket.on('chat-message', (data) => {
        setMessages(prev => [...prev, data]);
      });
    });

    return () => {
      socket.disconnect();
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

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
            if (sender) sender.replaceTrack(stream.getVideoTracks()[0]);
          });
          if (userVideo.current) userVideo.current.srcObject = stream;
          setIsScreenSharing(false);
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.error('Screen sharing failed', err);
      }
    } else {
      peersRef.current.forEach(({ peer }) => {
        const sender = peer._pc.getSenders().find(s => s.track.kind === 'video');
        if (sender) sender.replaceTrack(stream.getVideoTracks()[0]);
      });
      if (userVideo.current) userVideo.current.srcObject = stream;
      setIsScreenSharing(false);
    }
  };

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on('signal', signal => {
      socket.emit('signal', { targetId: userToSignal, signal });
    });
    return peer;
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on('signal', signal => {
      socket.emit('signal', { targetId: callerID, signal });
    });
    peer.signal(incomingSignal);
    return peer;
  };

  const toggleAudio = () => {
    stream.getAudioTracks()[0].enabled = !audioEnabled;
    setAudioEnabled(!audioEnabled);
  };

  const toggleVideo = () => {
    stream.getVideoTracks()[0].enabled = !videoEnabled;
    setVideoEnabled(!videoEnabled);
  };

  const sendChatMessage = () => {
    if (chatInput.trim()) {
      const msg = { sender: socket.id, content: chatInput };
      socket.emit('chat-message', msg);
      setMessages(prev => [...prev, msg]);
      setChatInput('');
    }
  };

  const leaveMeeting = () => {
    stream?.getTracks().forEach(track => track.stop());
    socket.disconnect();
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <h2 className="text-2xl font-bold text-indigo-700 mb-6">🧑‍🤝‍🧑 GD Room — {inviteLink}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Local Video */}
        <div className="relative">
          <video ref={userVideo} autoPlay playsInline muted className="w-full rounded-xl border-2 border-gray-500" />
          <p className="absolute bottom-2 left-2 bg-black text-white text-xs px-2 py-1 rounded">You</p>
        </div>

        {/* Peers’ Videos */}
        {peersRef.current.map(({ peerID, peer }) => (
          <Video key={peerID} peer={peer} peerID={peerID} />
        ))}
      </div>

      {/* 🎮 Floating Control Bar */}
      <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 z-50 bg-white/90 shadow-lg border rounded-full px-6 py-3 flex gap-4 items-center">
        <button
          onClick={toggleAudio}
          className="text-indigo-700 hover:text-white hover:bg-indigo-600 transition px-3 py-2 rounded-full"
        >
          {audioEnabled ? '🔇' : '🎙️'}
        </button>

        <button
          onClick={toggleVideo}
          className="text-indigo-700 hover:text-white hover:bg-indigo-600 transition px-3 py-2 rounded-full"
        >
          {videoEnabled ? '📷' : '📸'}
        </button>

        <button
          onClick={toggleScreenShare}
          className="text-yellow-600 hover:text-white hover:bg-yellow-500 transition px-3 py-2 rounded-full"
        >
          {isScreenSharing ? '🛑' : '🖥️'}
        </button>

        <button
          onClick={leaveMeeting}
          className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition"
        >
          🚪 Leave
        </button>
      </div>

      {/* Chat Panel */}
      <div className="max-w-2xl mx-auto w-full bg-white p-4 rounded shadow mt-10">
        <h3 className="text-lg font-semibold mb-2 text-indigo-700">💬 Chat</h3>

        <div className="h-48 overflow-y-auto border rounded p-2 mb-3 bg-gray-50 text-sm">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-1 ${msg.sender === socket.id ? 'text-right text-blue-600' : 'text-left text-gray-800'}`}
            >
              <strong>{msg.sender === socket.id ? 'You: ' : 'Peer: '}</strong>
              <span>{msg.content}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-grow px-3 py-2 border rounded focus:outline-none"
          />
          <button
            onClick={sendChatMessage}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function Video({ peer, peerID }) {
  const ref = useRef();

  useEffect(() => {
    peer.on('stream', stream => {
      if (ref.current) {
        ref.current.srcObject = stream;
      }
    });
  }, []);

  return (
    <div className="relative">
      <video ref={ref} autoPlay playsInline className="w-full rounded-xl border-2 border-gray-500" />
      <p className="absolute bottom-2 left-2 bg-black text-white text-xs px-2 py-1 rounded">
        {peerID.slice(0, 6)}...
      </p>
    </div>
  );
}

export default GDSessionRoom;
