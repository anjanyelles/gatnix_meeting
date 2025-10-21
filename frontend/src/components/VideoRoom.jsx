import { useEffect, useRef, useState } from 'react';
import { getSocket } from '../socket';
import SimplePeer from 'simple-peer';
import axios from 'axios';

export default function VideoRoom({ roomName, user, onLeave, token }) {
  const [participants, setParticipants] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState({});
  const localVideoRef = useRef(null);
  const peersRef = useRef({});
  const socket = getSocket();

  useEffect(() => {
    // Get local media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Join room after getting stream
        socket.emit('join-room', roomName);
        
        axios.post(
          `${import.meta.env.VITE_API_URL}/api/rooms/log`,
          { room_name: roomName, action: 'join' },
          { headers: { Authorization: `Bearer ${token}` } }
        ).catch(err => console.error('Log error:', err));
      })
      .catch(err => console.error('Media error:', err));

    // Listen for room updates
    socket.on('room-update', (data) => {
      setParticipants(data.users);
      
      // Create peers for new participants
      if (localStream) {
        data.users.forEach(participant => {
          if (participant.email !== user.email && !peersRef.current[participant.socketId]) {
            createPeer(participant.socketId, localStream);
          }
        });
      }
    });

    // Handle incoming WebRTC signals
    socket.on('receive-signal', ({ signal, fromSocketId, fromEmail }) => {
      if (!peersRef.current[fromSocketId]) {
        const peer = addPeer(signal, fromSocketId, localStream);
        peersRef.current[fromSocketId] = { peer, email: fromEmail };
        setPeers(prev => ({ ...prev, [fromSocketId]: { peer, email: fromEmail } }));
      } else {
        peersRef.current[fromSocketId].peer.signal(signal);
      }
    });

    socket.on('signal-returned', ({ signal, fromSocketId }) => {
      if (peersRef.current[fromSocketId]) {
        peersRef.current[fromSocketId].peer.signal(signal);
      }
    });

    return () => {
      socket.emit('leave-room', roomName);
      
      axios.post(
        `${import.meta.env.VITE_API_URL}/api/rooms/log`,
        { room_name: roomName, action: 'leave' },
        { headers: { Authorization: `Bearer ${token}` } }
      ).catch(err => console.error('Log error:', err));
      
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }

      // Destroy all peer connections
      Object.values(peersRef.current).forEach(({ peer }) => {
        peer.destroy();
      });
      peersRef.current = {};
    };
  }, [roomName, socket, token, user.email]);

  const createPeer = (targetSocketId, stream) => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: true,
      stream: stream
    });

    peer.on('signal', signal => {
      socket.emit('send-signal', {
        targetSocketId,
        signal
      });
    });

    peer.on('error', err => console.error('Peer error:', err));

    peersRef.current[targetSocketId] = { peer, email: '' };
    setPeers(prev => ({ ...prev, [targetSocketId]: { peer, email: '' } }));

    return peer;
  };

  const addPeer = (incomingSignal, callerSocketId, stream) => {
    const peer = new SimplePeer({
      initiator: false,
      trickle: true,
      stream: stream
    });

    peer.on('signal', signal => {
      socket.emit('return-signal', {
        targetSocketId: callerSocketId,
        signal
      });
    });

    peer.signal(incomingSignal);

    peer.on('error', err => console.error('Peer error:', err));

    return peer;
  };

  const handleLeave = () => {
    socket.emit('leave-room', roomName);
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    Object.values(peersRef.current).forEach(({ peer }) => {
      peer.destroy();
    });
    onLeave();
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">{roomName}</h1>
          <div className="text-white">
            <span className="text-2xl font-bold">{participants.length}</span> in room
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Local video */}
          <div className="bg-black rounded-lg overflow-hidden relative" >
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-64 object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white p-3 text-center font-semibold">
              You ({user.email})
            </div>
          </div>

          {/* Remote videos */}
          {participants
            .filter(p => p.email !== user.email)
            .map((participant) => (
              <RemoteVideo
                key={participant.socketId}
                participant={participant}
                peer={peers[participant.socketId]?.peer}
              />
            ))}
        </div>

        {/* Participant list */}
        <div className="bg-gray-800 text-white p-4 rounded-lg mb-6">
          <h2 className="font-bold mb-2">Participants ({participants.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {participants.map(p => (
              <div key={p.socketId} className="bg-gray-700 p-2 rounded text-sm truncate">
                {p.email} {p.email === user.email && '(You)'}
              </div>
            ))}
          </div>
        </div>

        {/* Leave button */}
        <button
          onClick={handleLeave}
          className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-semibold text-lg"
        >
          Leave Room
        </button>
      </div>
    </div>
  );
}

function RemoteVideo({ participant, peer }) {
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (peer) {
      peer.on('stream', remoteStream => {
        setStream(remoteStream);
      });
    }
  }, [peer]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="bg-black rounded-lg overflow-hidden relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-64 object-cover"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white p-3 text-center font-semibold truncate">
        {participant.email}
      </div>
    </div>
  );
}