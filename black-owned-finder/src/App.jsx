import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminPanel from './pages/AdminPanel';
import AddBusinessPage from './pages/AddBusinessPage';
import EditBusinessPage from './pages/EditBusinessPage';
// ... other imports

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/add-business" element={<AddBusinessPage />} />
        <Route path="/edit-business/:id" element={<EditBusinessPage />} />
        {/* Add your homepage and other routes here */}
      </Routes>
    </Router>
  );
}

export default App;
