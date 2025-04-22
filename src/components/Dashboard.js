import React, { useEffect, useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom"; // Import Link
//import axios from "axios";
import api from "../services/axiosConfig.js";
import { toast } from "react-toastify";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  PointElement,
} from "chart.js";
import AnnotationPlugin from "chartjs-plugin-annotation";
import * as signalR from "@microsoft/signalr";
import { AuthContext } from "../services/AuthContext";
// import { ToastContainer } from "react-toastify"; // Removed unused import

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  AnnotationPlugin,
  PointElement
);

const Dashboard = () => {
  const { isAuthenticated, user, logout, setUser } = useContext(AuthContext); // Add setUser
  const navigate = useNavigate();
  const [showDonatePopup, setShowDonatePopup] = useState(false);
  const [teams, setTeams] = useState([]);
  const [leftTeamStats, setLeftTeamStats] = useState(null);
  const [rightTeamStats, setRightTeamStats] = useState(null);
  const [lastColumn, setLastColumn] = useState("left");
  const [selectedLeftTeamId, setSelectedLeftTeamId] = useState(null);
  const [selectedRightTeamId, setSelectedRightTeamId] = useState(null);
  const [loading, setLoading] = useState(false); // Manages loading state
  const [gameStats, setGameStats] = useState([]);
  const [leftTeamStatsLast10Games, setLeftTeamStatsLast10Games] = useState([]);
  const [rightTeamStatsLast10Games, setRightTeamStatsLast10Games] = useState(
    []
  );
  // Use environment variable for API URL, fallback to localhost for local dev
  const baseUrl = process.env.REACT_APP_API_URL || "http://localhost:5087";

  useEffect(() => {
    console.log(isAuthenticated);
    // if (!isAuthenticated) {
    //   navigate("/login");
    // }

    const fetchTeams = async () => {
      try {
        const timezoneOffsetMinutes = new Date().getTimezoneOffset();
        const response = await api.get(`${baseUrl}/teams`, {
          params: { timezoneOffsetMinutes },
        });
        setTeams(response.data.slice(0, 30));
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
    };

    fetchTeams();

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/gamestatsHub`, {
        withCredentials: true,
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveGameStats", (newGameStats) => {
      console.log(newGameStats);
      setGameStats([newGameStats]);
    });

    connection.on("ReceiveDonationUpdate", (updatedUserId) => {
      console.log("Received donation update for user ID:", updatedUserId);
      if (user && user.id === updatedUserId) {
        console.log("Donation update matches current user. Updating state...");
        setShowDonatePopup(false);
        const updatedUser = { ...user, isDonated: true };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        toast.success("Donation successful! You now have full access.");
      }
    });

    const start = async () => {
      connection
        .start()
        .then(() => {
          console.log("SignalR connection started.");
        })
        .catch((err) =>
          console.error("Failed to start SignalR connection:", err)
        );
    };

    connection.onclose(async (err) => {
      console.error("Connection closed:", err);
    });

    start();

    return () => {
      connection.stop().then(() => console.log("SignalR connection stopped."));
    };
    // Added baseUrl to dependency array as required by ESLint
  }, [isAuthenticated, navigate, user, setUser, baseUrl]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Fetches detailed player stats - loading state removed, handled by caller
  const fetchTeamStats = async (teamId, setStats, setSelectedTeamId) => {
    try {
      const response = await api.get(
        `${baseUrl}/Players/players-stats/${teamId}`
      );
      setStats(response.data);
      setSelectedTeamId(teamId);
    } catch (error) {
      console.error("Error fetching team stats:", error);
      // Re-throw or handle error appropriately if needed by caller
      throw error; // Re-throwing allows the caller's catch block to handle it
    }
  };

  // Records the team click via API (fire-and-forget is okay here)
  const recordTeamClick = async (teamAbbreviation) => {
    if (!teamAbbreviation) {
      console.warn(
        "Attempted to record click for undefined team abbreviation."
      );
      return;
    }
    try {
      await api.post(`${baseUrl}/teams/${teamAbbreviation}/click`); // Use correct path
      console.log(`Click recorded for team: ${teamAbbreviation}`);
    } catch (error) {
      console.error(
        `Error recording click for team ${teamAbbreviation}:`,
        error
      );
    }
  };

  // Fetches summary stats for the last 10 games
  const fetchTeamStatsLast10Games = async (teamId) => {
    try {
      // Use correct endpoint from TeamsController
      const response = await api.get(`${baseUrl}/team-stats/${teamId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching team stats last 10 games:", error);
      throw error; // Re-throwing allows the caller's catch block to handle it
    }
  };

  // Handles the sequence of actions when a team is clicked, managing loading state
  const handleTeamClick = async (teamId) => {
    if (loading) {
      console.log("handleTeamClick aborted: Already loading");
      return;
    }
    console.log(
      `handleTeamClick started for teamId: ${teamId}. Setting loading to true.`
    );
    setLoading(true); // Set loading state to true immediately
    try {
      // Fetch the stats for the last 10 games first
      console.log(`Fetching last 10 games stats for teamId: ${teamId}...`);
      const teamStatsLast10 = await fetchTeamStatsLast10Games(teamId);
      console.log(
        `Fetched last 10 games stats for teamId: ${teamId}`,
        teamStatsLast10
      );

      // Determine which column (left or right) to update and fetch detailed player stats
      if (lastColumn === "left") {
        console.log(`Updating left column for teamId: ${teamId}`);
        setLeftTeamStatsLast10Games(teamStatsLast10);
        // Now fetch the detailed player stats for the left column, ensuring we wait
        console.log(
          `Fetching detailed stats for left column (teamId: ${teamId})...`
        );
        await fetchTeamStats(teamId, setLeftTeamStats, setSelectedLeftTeamId);
        console.log(
          `Fetched detailed stats for left column (teamId: ${teamId})`
        );
        setLastColumn("right"); // Switch the target column for the next click
      } else {
        console.log(`Updating right column for teamId: ${teamId}`);
        setRightTeamStatsLast10Games(teamStatsLast10);
        // Now fetch the detailed player stats for the right column, ensuring we wait
        console.log(
          `Fetching detailed stats for right column (teamId: ${teamId})...`
        );
        await fetchTeamStats(teamId, setRightTeamStats, setSelectedRightTeamId);
        console.log(
          `Fetched detailed stats for right column (teamId: ${teamId})`
        );
        setLastColumn("left"); // Switch the target column for the next click
      }
      console.log(
        `handleTeamClick try block finished successfully for teamId: ${teamId}`
      );
    } catch (error) {
      // Catch any errors from the awaited async operations
      console.error(`Error in handleTeamClick for teamId: ${teamId}:`, error);
      toast.error("Failed to load team data."); // Inform user
    } finally {
      // This block ALWAYS runs, ensuring loading is set to false
      console.log(
        `handleTeamClick finally block for teamId: ${teamId}. Setting loading to false soon.` // Log updated
      );
      // Delay setting loading to false slightly using setTimeout
      setTimeout(() => {
        console.log("setTimeout inside finally: Setting loading to false now."); // New log
        setLoading(false);
      }, 0); // 0ms delay pushes execution to the next event loop tick
    }
  };

  const renderChart = (teamStats) => {
    if (!teamStats) return null;
    return teamStats.map((playerStats) => {
      if (!playerStats || !playerStats.pointsPerLast10Games) return null;
      const data = {
        labels: playerStats.pointsPerLast10Games.map((game) =>
          new Date(game.gameDate + "Z").toLocaleDateString()
        ),
        datasets: [
          {
            label: "Minutes (Avg: " + playerStats.mins + ")",
            data: playerStats.pointsPerLast10Games.map((game) => game.mins),
            borderColor: "red",
            backgroundColor: "red",
            fill: false,
          },
          {
            label: "Points (Avg: " + playerStats.pointsAvg + ")",
            data: playerStats.pointsPerLast10Games.map((game) => game.points),
            borderColor: "green",
            backgroundColor: "green",
            fill: false,
          },
          {
            label: `Rebounds (Avg: ${playerStats.reboundsAvg})`,
            data: playerStats.pointsPerLast10Games.map((game) => game.rebounds),
            borderColor: "blue",
            backgroundColor: "blue",
            fill: false,
            hidden: true,
          },
          {
            label: `Assists (Avg: ${playerStats.assistsAvg})`,
            data: playerStats.pointsPerLast10Games.map((game) => game.assists),
            borderColor: "orange",
            backgroundColor: "orange",
            fill: false,
            hidden: true,
          },
        ],
      };

      const average = playerStats.pointsAvg;
      const options = {
        responsive: true,
        plugins: {
          legend: { display: true },
          title: { display: true, text: playerStats.playerCode },
          tooltip: {
            callbacks: {
              label: function (context) {
                const game =
                  playerStats.pointsPerLast10Games[context.dataIndex];
                if (!game) return "";
                return [
                  `Points: ${context.raw}`,
                  `Win/Loss: ${game.winOrLoss}`,
                  `Team Score: ${game.teamScore}`,
                  `Opponent: ${game.oppTeamName}`,
                ];
              },
            },
          },
          annotation: {
            annotations: {
              line1: {
                type: "line",
                yMin: average,
                yMax: average,
                borderColor: "black",
                borderWidth: 2,
              },
            },
          },
        },
        scales: {
          x: {
            ticks: {
              callback: function (val, index) {
                const game = playerStats.pointsPerLast10Games[index];
                if (!game) return "";
                return `${new Date(
                  game.gameDate + "Z"
                ).toLocaleDateString()} - ${
                  game.winOrLoss === "Won" ? "W" : "L"
                } - ${game.teamScore} - ${game.oppTeamName} - ${
                  game.oppTeamScore
                }`;
              },
              color: function (context) {
                const game = playerStats.pointsPerLast10Games[context.index];
                if (!game) return "black";
                return game.winOrLoss === "Won" ? "green" : "red";
              },
            },
          },
        },
      };
      return (
        <div key={playerStats.playerCode}>
          <Line data={data} options={options} height={250} />
        </div>
      );
    });
  };

  const renderTeamChart = (teamStats) => {
    if (
      !teamStats ||
      !teamStats.scoreLastGames ||
      teamStats.scoreLastGames.length === 0
    ) {
      return <p>No team stats available. Click a team to show stats.</p>;
    }
    const data = {
      labels: teamStats.scoreLastGames.map((game) =>
        new Date(game.gameDate + "Z").toLocaleDateString()
      ),
      datasets: [
        {
          label: `Scores - Avg: ${teamStats.scoreAvg}`,
          data: teamStats.scoreLastGames.map((game) => game.teamScore),
          borderColor: "green",
          backgroundColor: "green",
          fill: false,
        },
      ],
    };
    const average = teamStats.scoreAvg;
    const options = {
      responsive: true,
      plugins: {
        legend: { display: true },
        title: { display: true, text: "Team Stats (Last 10 Games)" },
        annotation: {
          annotations: {
            line1: {
              type: "line",
              yMin: average,
              yMax: average,
              borderColor: "black",
              borderWidth: 2,
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            callback: function (val, index) {
              const game = teamStats.scoreLastGames[index];
              if (!game) return "";
              return `${new Date(game.gameDate + "Z").toLocaleDateString()} - ${
                game.winOrLose === "Won" ? "W" : "L"
              } - ${game.teamScore} - ${game.abbr} - ${game.abbrScore}`;
            },
            color: function (context) {
              const game = teamStats.scoreLastGames[context.index];
              if (!game) return "black";
              return game.winOrLose === "Won" ? "green" : "red";
            },
          },
        },
      },
    };
    return <Line data={data} options={options} height={250} />;
  };

  return (
    <>
      {/* Donate Popup */}
      {showDonatePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">
              Please Donate
            </h2>
            {user && (
              <p className="text-lg font-medium mb-4 text-center text-gray-700">
                Hi, {user.email}!
              </p>
            )}
            <p className="text-gray-600 mb-6 text-center">
              To access detailed team statistics and player analysis, please
              support us with a donation.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => navigate("/donation")}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Donate Now
              </button>
              <button
                onClick={() => setShowDonatePopup(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <header className="container-fluid bg-gray-800 p-4 flex justify-between items-center">
        <h1 className="text-white text-2xl font-bold">NBA Teams</h1>
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <span className="text-white font-medium">
                {/* Display email if available, otherwise display name (username), fallback to "User" */}
                Welcome, {user?.email || user?.name || "User"}!
              </span>
              <button
                className="bg-orange-500 text-white px-4 py-2 rounded mr-2"
                onClick={() => setShowDonatePopup(true)}
              >
                Donate
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
              <button
                className="bg-green-500 text-white px-4 py-2 rounded"
                onClick={() => navigate("/register")}
              >
                Register
              </button>
            </>
          )}
        </div>
      </header>
      <hr style={{ border: "1px solid #c0c0c0" }}></hr>
      <div className="container mx-auto p-4" style={{ display: "flex" }}>
        <div>
          <ul className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-8">
            {Array.isArray(teams) &&
              teams.map((team) => (
                <li
                  key={team.id}
                  className={`p-2 bg-gray-100 rounded shadow ${
                    !team.isClickable && !user
                      ? "cursor-not-allowed"
                      : team.id === selectedLeftTeamId ||
                        team.id === selectedRightTeamId ||
                        loading
                      ? "cursor-pointer hover:bg-gray-200"
                      : "cursor-pointer hover:bg-gray-200" // Simplified conditional class
                  }`}
                  onClick={() => {
                    if ((!team.isClickable && !user) || loading) return;
                    if (
                      !team.isClickable &&
                      user &&
                      user.isDonated === "False"
                    ) {
                      setShowDonatePopup(true);
                      return;
                    }
                    if (
                      team.id !== selectedLeftTeamId &&
                      team.id !== selectedRightTeamId
                    ) {
                      console.log(
                        `onClick: Conditions met for teamId: ${team.id}. Calling recordTeamClick and handleTeamClick...`
                      ); // Thêm log ở đây
                      recordTeamClick(team.abbr); // Record click
                      handleTeamClick(team.id); // Fetch data, manage loading
                    } else {
                      console.log(
                        `onClick: Conditions NOT met or team already selected for teamId: ${team.id}`
                      ); // Log trường hợp không gọi handleTeamClick
                    }
                  }}
                  style={{
                    width: "200px",
                    height: "100px",
                    textAlign: "center",
                    display: "flex",
                    position: "relative",
                  }}
                >
                  {!team.isClickable && !user && (
                    <div className="absolute top-0 left-0 bg-green-500 text-white text-xs px-2 py-1 rounded-tl">
                      Register
                    </div>
                  )}
                  {!team.isClickable &&
                    user?.isDonated === "False" && ( // Added optional chaining for user
                      <div className="absolute top-0 left-0 bg-orange-500 text-white text-xs px-2 py-1 rounded-tl">
                        Donate {/* Kept as Donate */}
                      </div>
                    )}

                  {gameStats[0]?.teamInfo?.filter(
                    (info) => info.abbr === team.abbr
                  ).length > 0 ? (
                    gameStats[0].teamInfo
                      .filter((info) => info.abbr === team.abbr)
                      .map((info, index) => (
                        <div key={index} style={{ marginTop: "17px" }}>
                          {info.pointLeader && info.points && info.position ? (
                            <>
                              <p className="game-date-title">
                                Top player in game on {/* Translated */}
                                <br />
                                {new Date(
                                  gameStats[0].gameDate + "Z"
                                ).toLocaleDateString()}
                              </p>
                              <div className="game-stats">
                                <p className="game-stats-title">
                                  {info.pointLeader}:
                                </p>
                                <p className="game-stats-content">
                                  {info.points}
                                </p>
                                <p className="game-stats-title">position:</p>
                                <p className="game-stats-content">
                                  {info.position}
                                </p>
                              </div>
                            </>
                          ) : (
                            <p className="game-stats-title"></p>
                          )}
                          <div className="live-text">Live</div>{" "}
                          {/* Kept as Live */}
                        </div>
                      ))
                  ) : (
                    <div className="off-title">Off</div> /* Kept as Off */
                  )}
                  <img
                    src={team.logo}
                    alt={team.name}
                    className="w-12 h-12 mb-2 mx-auto"
                    style={{
                      width: "35px",
                      height: "35px",
                      right: "0px",
                      position: "absolute",
                    }}
                  />
                </li>
              ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4" style={{ marginLeft: "20px" }}>
          {/* Left stats */}
          <div
            className="bg-gray-100 p-4 rounded-xl shadow-md"
            style={{ width: "520px" }}
          >
            <h2 className="text-xl font-bold mb-4">
              {leftTeamStats?.[0]?.teamName || ""}
            </h2>
            {leftTeamStats ? (
              <div>
                {renderTeamChart(leftTeamStatsLast10Games)}
                {renderChart(leftTeamStats)}
              </div>
            ) : (
              <p>
                No team stats to display. Click a team to show stats.
              </p> /* Already English */
            )}
          </div>
          {/* Right stats */}
          <div
            className="bg-gray-100 p-4 rounded-xl shadow-md"
            style={{ width: "520px" }}
          >
            <h2 className="text-xl font-bold mb-4">
              {rightTeamStats?.[0]?.teamName || ""}
            </h2>
            {rightTeamStats ? (
              <div>
                {renderTeamChart(rightTeamStatsLast10Games)}
                {renderChart(rightTeamStats)}
              </div>
            ) : (
              <p>
                No team stats to display. Click a team to show stats.
              </p> /* Already English */
            )}
          </div>
        </div>
      </div>
      <hr style={{ border: "1px solid #c0c0c0" }}></hr>
      {/* Sửa lỗi: Gộp className và xóa style không cần thiết */}
      <footer className="container-fluid bg-gray-800 mx-auto p-4 mt-8 text-white text-center">
        {/* Chart Color Legend */}
        <div className="mb-4 text-xs">
          <span className="font-semibold">Chart Legend:</span>
          <span className="ml-2">
            <span style={{ color: "red" }}>●</span> Minutes
          </span>
          <span className="ml-2">
            <span style={{ color: "green" }}>●</span> Points/Scores
          </span>
          <span className="ml-2">
            <span style={{ color: "blue" }}>●</span> Rebounds
          </span>
          <span className="ml-2">
            <span style={{ color: "orange" }}>●</span> Assists
          </span>
          <span className="ml-2">
            {" "}
            | (Avg = Average of last 10 visible games)
          </span>
        </div>

        {/* Existing links and Disclaimer */}
        <p className="text-sm">
          {" "}
          {/* Changed size for consistency */}
          For more information, visit{" "}
          <a
            href="https://www.nba.com"
            target="_blank"
            className="text-blue-400"
            rel="noreferrer"
          >
            NBA.com
          </a>
          <span className="mx-2">|</span> {/* Separator */}
          <Link to="/disclaimer" className="text-blue-400 hover:underline">
            Disclaimer
          </Link>
        </p>
      </footer>
      {/* Log giá trị loading ngay trước khi render overlay */}
      {console.log("Rendering component, loading state is:", loading)}
      {/* Thay đổi cách render để tường minh hơn */}
      {loading ? (
        <div className="loader-overlay">
          <div className="loader"></div>
        </div>
      ) : null}
      {/* Đã xóa dấu )} bị thừa */}
    </>
  );
};

export default Dashboard;
