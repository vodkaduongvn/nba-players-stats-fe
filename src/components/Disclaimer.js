import React from "react";
import { Link } from "react-router-dom"; // Import Link for navigation

const Disclaimer = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Disclaimer
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <p className="text-gray-700 mb-4">
            nbastatspro.com does not host, upload, or control any data or
            information. The information and data you see here are shared by
            sports fans worldwide or directly from the nba.com website.
          </p>
          <p className="text-gray-700 mb-6">
            We only act as an intermediary to facilitate your search and will
            not be responsible for any violations or how you use this data.
          </p>
          <div className="text-center">
            <Link
              to="/"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              &larr; Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;
