import SimplePeer from 'simple-peer';
import { useEffect, useRef } from 'react';
import { getSocket } from '../socket';

export default function WebRTCPeer({ userId, userEmail, onStream, initiator }) {
  const peerRef = useRef(null);
  const socket = getSocket();

  useEffect(() => {
    const peer = new SimplePeer({
      initiator,
      trickleIce: true,
      streams: [/* getUserMedia stream will be added */]
    });

    peer.on('signal', (data) => {
      socket.emit('send-signal', {
        targetSocketId: userId,
        signal: data
      });
    });

    peer.on('stream', (stream) => {
      onStream(stream);
    });

    peer.on('error', (err) => console.error('Peer error:', err));

    peerRef.current = peer;

    socket.on('receive-signal', ({ signal, fromSocketId, fromEmail }) => {
      if (fromSocketId === userId) {
        peer.signal(signal);
      }
    });

    socket.on('signal-returned', ({ signal, fromSocketId }) => {
      if (fromSocketId === userId) {
        peer.signal(signal);
      }
    });

    return () => {
      peer.destroy();
    };
  }, [userId, initiator, socket, onStream]);

  return null;
}