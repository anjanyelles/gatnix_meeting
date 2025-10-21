import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import VideoRoom from './components/VideoRoom';
import { connectSocket, disconnectSocket } from './socket';

export default function App() {
  const [auth, setAuth] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);

  useEffect(() => {
    const savedAuth = localStorage.getItem('auth');
    if (savedAuth) {
      const parsed = JSON.parse(savedAuth);
      setAuth(parsed);
      connectSocket(parsed.token);
    }
  }, []);

  const handleLogin = (token, user) => {
    const authData = { token, user };
    setAuth(authData);
    localStorage.setItem('auth', JSON.stringify(authData));
    connectSocket(token);
  };

  const handleLogout = () => {
    disconnectSocket();
    localStorage.removeItem('auth');
    setAuth(null);
    setCurrentRoom(null);
  };

  if (!auth) return <Login onLogin={handleLogin} />;

  return (
    <div>
      {currentRoom ? (
        <VideoRoom
          roomName={currentRoom}
          user={auth.user}
          onLeave={() => setCurrentRoom(null)}
          token={auth.token}
        />
      ) : (
        <>
          <Dashboard user={auth.user} onRoomSelect={setCurrentRoom} />
          <button
            onClick={handleLogout}
            className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </>
      )}
    </div>
  );
}