import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../services/AuthContext";
import api from "../services/axiosConfig";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Admin = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchUsername, setSearchUsername] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [donationAmount, setDonationAmount] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [activeUsersCount, setActiveUsersCount] = useState(null); // State for active users

  // Use environment variable for API URL, fallback to localhost for local dev
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:5087";

  // Effect for Authentication and Role Check (existing)
  useEffect(() => {
    // Redirect to login if not authenticated
    // Note: We also need backend authorization check for true security
    if (!isAuthenticated) {
      navigate("/login");
      return; // Stop execution if not authenticated
    }
    // --- Frontend Role Check ---
    // Check the 'role' property set in AuthContext
    const roles = user?.role
      ? Array.isArray(user.role)
        ? user.role
        : [user.role]
      : [];

    if (!roles.includes("Admin")) {
      toast.error(
        "Access Denied: You do not have permission to view this page."
      );
      navigate("/dashboard"); // Redirect non-admins away
      return; // Stop further execution in this component
    }
    // --- End Frontend Role Check ---
  }, [isAuthenticated, navigate, user]);

  // Effect for Fetching Active Users Count (new)
  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        // Assuming a backend endpoint /api/admin/active-users provides the count
        const response = await api.get(`${baseUrl}/api/admin/active-users`);
        setActiveUsersCount(response.data.count); // Adjust based on actual API response structure
      } catch (error) {
        console.error("Error fetching active users count:", error);
        // Optionally show a toast message, but might be noisy if polling frequently
        // toast.error("Could not fetch active users count.");
        setActiveUsersCount(null); // Reset or indicate error state
      }
    };

    // Fetch immediately and then set an interval to poll every 10 seconds
    fetchActiveUsers();
    const intervalId = setInterval(fetchActiveUsers, 10000); // Poll every 10 seconds

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [baseUrl]); // Dependency array includes baseUrl

  // handleSearch and handleSubmitDonation functions (existing, unchanged)
  const handleSearch = async () => {
    if (!searchUsername.trim()) {
      toast.error("Please enter a username to search.");
      return;
    }
    setLoadingSearch(true);
    setSearchError("");
    setFoundUser(null); // Reset previous search result
    try {
      // Use the username from the state for the query parameter
      // Update the API endpoint to match the new backend route /api/admin/search
      const response = await api.get(`${baseUrl}/api/admin/search`, {
        params: { username: searchUsername },
      });
      setFoundUser(response.data);
      toast.success(`User "${response.data.userName}" found.`);
    } catch (error) {
      console.error("Error searching user:", error);
      if (error.response?.status === 404) {
        setSearchError(`User "${searchUsername}" not found.`);
        toast.error(`User "${searchUsername}" not found.`);
      } else {
        setSearchError("An error occurred while searching.");
        toast.error("An error occurred while searching.");
      }
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSubmitDonation = async (e) => {
    e.preventDefault();
    if (!foundUser) {
      toast.error("Please search and find a user first.");
      return;
    }
    const amount = parseFloat(donationAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid donation amount greater than 0.");
      return;
    }

    setLoadingSubmit(true);
    try {
      await api.post(`${baseUrl}/api/admin/donations`, {
        username: foundUser.userName, // Use the username from the found user state
        amount: amount,
      });
      toast.success(
        `Donation of ${amount} for user "${foundUser.userName}" processed successfully.`
      );
      // Optionally clear fields after successful submission
      setDonationAmount("");
      setDonationAmount("");
    } catch (error) {
      console.error("Error submitting donation:", error);
      toast.error(
        error.response?.data ||
          "An error occurred while submitting the donation."
      );
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      {/* Removed redundant ToastContainer */}
      {/* <h1 className="text-3xl font-bold mb-6">Admin Donation Panel</h1> */}
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>{" "}
      {/* Changed Title */}
      {/* Active Users Count Display (new) */}
      <div className="bg-white p-4 rounded shadow-md w-full max-w-md mb-6">
        <h2 className="text-xl font-semibold mb-2">Website Status</h2>
        <p>
          Active Users:{" "}
          {activeUsersCount !== null ? (
            <span className="font-bold">{activeUsersCount}</span>
          ) : (
            "Loading..."
          )}
        </p>
      </div>
      {/* User Search Section */}
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md mb-6">
        {/* <h2 className="text-xl font-semibold mb-4">Search User</h2> */}
        <h2 className="text-xl font-semibold mb-4">
          Search User & Add Donation
        </h2>{" "}
        {/* Combined Title */}
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            placeholder="Enter username"
            className="flex-grow p-2 border rounded"
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            disabled={loadingSearch}
          />
          <button
            onClick={handleSearch}
            className={`bg-blue-500 text-white px-4 py-2 rounded ${
              loadingSearch
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blue-600"
            }`}
            disabled={loadingSearch}
          >
            {loadingSearch ? "Searching..." : "Search"}
          </button>
        </div>
        {searchError && (
          <p className="text-red-500 text-sm mb-2">{searchError}</p>
        )}
        {foundUser && (
          <div className="bg-gray-50 p-3 rounded border mb-4">
            {" "}
            {/* Added margin bottom */}
            <p>
              <strong>ID:</strong> {foundUser.id}
            </p>
            <p>
              <strong>Username:</strong> {foundUser.userName}
            </p>
            <p>
              <strong>Email:</strong> {foundUser.email}
            </p>
          </div>
        )}
        {/* Donation Submission Section (Moved inside search card) */}
        {foundUser && (
          <form
            onSubmit={handleSubmitDonation}
            // No separate card needed, styles removed
          >
            {/* Title removed, incorporated into label */}
            <div className="mb-4">
              <label
                htmlFor="donationAmount"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                {/* Updated Label */}
                Donation Amount ($) for {foundUser.userName}
              </label>
              <input
                id="donationAmount"
                type="number"
                step="0.01" // Allows decimal input for currency
                placeholder="Enter amount"
                className="w-full p-2 border rounded"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                disabled={loadingSubmit}
              />
            </div>
            <button
              type="submit"
              className={`w-full bg-green-500 text-white px-4 py-2 rounded ${
                loadingSubmit
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-green-600"
              }`}
              disabled={loadingSubmit}
            >
              {loadingSubmit ? "Submitting..." : "Submit Donation"}
            </button>
          </form>
        )}
      </div>{" "}
      {/* End of combined search/donation card */}
      {/* Donation Submission Section - Removed as it's moved inside the search card */}
    </div>
  );
};

export default Admin;
