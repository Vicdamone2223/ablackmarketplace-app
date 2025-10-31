const MoreCategories = () => {
  const categories = ['Beauty', 'Fitness', 'Consulting', 'Tech', 'Media', 'Events'];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Explore More Categories</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {categories.map((category, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition cursor-pointer text-center"
          >
            {category}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoreCategories;

