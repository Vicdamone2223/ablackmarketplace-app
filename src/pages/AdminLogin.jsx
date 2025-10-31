import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [pass, setPass] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pass === import.meta.env.VITE_ADMIN_PASS) {
      localStorage.setItem('adminLoggedIn', 'true');
      navigate('/admin');
    } else {
      alert('❌ Wrong password.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <h2 className="text-lg font-bold">Admin Login</h2>
      <input
        type="password"
        placeholder="Enter admin password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
        className="border p-2 w-full"
      />
      <button className="bg-black text-white px-4 py-2 rounded">Login</button>
    </form>
  );
};

export default AdminLogin;
