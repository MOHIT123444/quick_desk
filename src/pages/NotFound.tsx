import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation(); // Hook to get current location info

  useEffect(() => {
    // Log the 404 error and attempted route path to the console
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]); // Run this effect whenever the path changes

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {/* Centered 404 content */}
      <div className="text-center">
        {/* Main 404 heading */}
        <h1 className="text-4xl font-bold mb-4">404</h1>

        {/* Subheading message */}
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>

        {/* Link to redirect back to home */}
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
