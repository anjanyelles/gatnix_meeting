import { useEffect, useState } from 'react';
import { getSocket } from '../socket';

export default function Dashboard({ user, onRoomSelect }) {
  const [rooms, setRooms] = useState({
    'Resume Team': 0,
    'Technical Recruiter Team': 0,
    'Tea Break': 0,
    'Lunch Break': 0
  });

  useEffect(() => {
    const socket = getSocket();
    
    // Fetch initial room status
    const fetchRooms = () => {
      socket.emit('get-rooms');
    };
    
    fetchRooms();
    
    socket.on('rooms-update', (data) => {
      setRooms(data);
    });
    
    const interval = setInterval(fetchRooms, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const roomList = [
    { name: 'Resume Team', icon: '📄' },
    { name: 'Technical Recruiter Team', icon: '👔' },
    { name: 'Tea Break', icon: '☕' },
    { name: 'Lunch Break', icon: '🍽️' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            Welcome, {user.email.split('@')[0]}!
          </h1>
          <div className="text-lg text-gray-600 bg-white px-4 py-2 rounded-lg">
            Team: <span className="font-semibold">{user.team}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roomList.map((room) => (
            <div
              key={room.name}
              className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition cursor-pointer transform hover:scale-105"
              onClick={() => onRoomSelect(room.name)}
            >
              <div className="text-5xl mb-4">{room.icon}</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{room.name}</h2>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Active Users:</span>
                <span className="text-3xl font-bold text-blue-500">
                  {rooms[room.name] || 0}
                </span>
              </div>
              <button className="w-full mt-4 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition font-semibold">
                Join Room
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}