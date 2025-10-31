import { Link } from 'react-router-dom';

const MorePage = () => {
  return (
    <div className="p-6 pb-24 max-w-md mx-auto space-y-6">
      <h1 className="text-xl font-bold">More Options</h1>

      <div className="space-y-4">
        <Link
          to="/suggest"
          className="block w-full bg-black text-white text-center py-3 rounded hover:bg-black/90"
        >
          Suggest a Business
        </Link>

        <Link
          to="/advertise"
          className="block w-full bg-black text-white text-center py-3 rounded hover:bg-black/90"
        >
          Advertise With Us
        </Link>
      </div>
    </div>
  );
};

export default MorePage;
