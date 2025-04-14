import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
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
import { ToastContainer } from "react-toastify";

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
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showDonatePopup, setShowDonatePopup] = useState(false);
  const [teams, setTeams] = useState([]);
  const [leftTeamStats, setLeftTeamStats] = useState(null);
  const [rightTeamStats, setRightTeamStats] = useState(null);
  const [lastColumn, setLastColumn] = useState("left");
  const [selectedLeftTeamId, setSelectedLeftTeamId] = useState(null);
  const [selectedRightTeamId, setSelectedRightTeamId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gameStats, setGameStats] = useState([]);
  const [leftTeamStatsLast10Games, setLeftTeamStatsLast10Games] = useState([]);
  const [rightTeamStatsLast10Games, setRightTeamStatsLast10Games] = useState(
    []
  );
  const baseUrl = "http://localhost:5087";

  useEffect(() => {
    console.log(isAuthenticated);
    // if (!isAuthenticated) {
    //   navigate("/login");
    // }

    const fetchTeams = async () => {
      try {
        const response = await api.get(`${baseUrl}/teams`);
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
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const fetchTeamStats = async (teamId, setStats, setSelectedTeamId) => {
    setLoading(true);
    try {
      const response = await api.get(
        `${baseUrl}/Players/players-stats/${teamId}`
      );
      setStats(response.data);
      setSelectedTeamId(teamId);
    } catch (error) {
      console.error("Error fetching team stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamClick = async (teamId) => {
    if (loading) return;
    const teamStats = await fetchTeamStatsLast10Games(teamId);

    if (lastColumn === "left") {
      setLeftTeamStatsLast10Games(teamStats);
      fetchTeamStats(teamId, setLeftTeamStats, setSelectedLeftTeamId);
      setLastColumn("right");
    } else {
      setRightTeamStatsLast10Games(teamStats);
      fetchTeamStats(teamId, setRightTeamStats, setSelectedRightTeamId);
      setLastColumn("left");
    }
  };

  const renderChart = (teamStats) => {
    return teamStats.map((playerStats) => {
      const data = {
        labels: playerStats.pointsPerLast10Games.map(
          (game) => new Date(game.gameDate + "Z").toLocaleDateString() // Append 'Z'
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
          legend: {
            display: true,
          },
          title: {
            display: true,
            text: playerStats.playerCode,
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const game =
                  playerStats.pointsPerLast10Games[context.dataIndex];
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
                return `${new Date(
                  game.gameDate + "Z"
                ).toLocaleDateString()} - ${
                  // Append 'Z'
                  game.winOrLoss === "Won" ? "W" : "L"
                } - ${game.teamScore} - ${game.oppTeamName} - ${
                  game.oppTeamScore
                }`;
              },
              color: function (context) {
                const game = playerStats.pointsPerLast10Games[context.index];
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
      labels: teamStats.scoreLastGames.map(
        (game) => new Date(game.gameDate + "Z").toLocaleDateString() // Append 'Z'
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
        legend: {
          display: true,
        },
        title: {
          display: true,
          text: "Team Stats (Last 10 Games)",
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
              const game = teamStats.scoreLastGames[index];
              return `${new Date(game.gameDate + "Z").toLocaleDateString()} - ${
                // Append 'Z'
                game.winOrLose === "Won" ? "W" : "L"
              } - ${game.teamScore} - ${game.abbr} - ${game.abbrScore}`;
            },
            color: function (context) {
              const game = teamStats.scoreLastGames[context.index];
              return game.winOrLose === "Won" ? "green" : "red";
            },
          },
        },
      },
    };

    return <Line data={data} options={options} height={250} />;
  };

  const fetchTeamStatsLast10Games = async (teamId) => {
    try {
      const response = await api.get(`${baseUrl}/team-stats/${teamId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching team stats last 5 games:", error);
      return [];
    }
  };

  return (
    <>
      {/* Donate Popup */}
      {showDonatePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
              Please Donate
            </h2>
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
                Welcome, {user.email || "User"}!
              </span>
              <button
                className="bg-orange-500 text-white px-4 py-2 rounded mr-2" // Added margin-right for spacing
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
                      : "cursor-pointer hover:bg-gray-200"
                  }`}
                  onClick={() => {
                    if ((!team.isClickable && !user) || loading) {
                      // If team is restricted and no user is logged in, or loading, do nothing
                      return;
                    } else if (
                      !team.isClickable &&
                      user &&
                      user.isDonated === "False"
                    ) {
                      // If team is restricted and user exists and has not donated
                      setShowDonatePopup(true); // Show donate popup
                      return;
                    } else if (
                      !team.isClickable &&
                      user &&
                      user.isDonated !== "False"
                    ) {
                      // If team is restricted and user exists and HAS donated (or status is not "False")
                      // Allow click or do nothing, depending on desired behavior for donated users on restricted teams
                      // For now, let's assume they can click if donated. If not, add 'return;' here.
                    }
                    // If team is clickable, or if it's restricted but user HAS donated, proceed with click handler
                    if (
                      team.id !== selectedLeftTeamId &&
                      team.id !== selectedRightTeamId
                    ) {
                      handleTeamClick(team.id);
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
                  {/* Show Donate label if team is restricted and user is logged in but hasn't donated */}
                  {!team.isClickable && user && user.isDonated === "False" && (
                    <div className="absolute top-0 left-0 bg-orange-500 text-white text-xs px-2 py-1 rounded-tl">
                      Donate
                    </div>
                  )}

                  {gameStats[0]?.teamInfo &&
                  gameStats[0].teamInfo.filter(
                    (info) => info.abbr === team.abbr
                  ).length > 0 ? (
                    gameStats[0].teamInfo
                      .filter((info) => info.abbr === team.abbr)
                      .map((info, index) => (
                        <div key={index} style={{ marginTop: "17px" }}>
                          {info.pointLeader && info.points && info.position ? (
                            <>
                              <p className="game-date-title">
                                Top 1 player in game on
                                <br />
                                {new Date( // Append 'Z'
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
                          <div className="live-text">Live</div>
                        </div>
                      ))
                  ) : (
                    <div className="off-title">Off</div>
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
              {leftTeamStats != null && leftTeamStats[0] != null
                ? leftTeamStats[0].teamName
                : ""}
            </h2>
            {leftTeamStats ? (
              <div>
                {renderTeamChart(leftTeamStatsLast10Games)}

                {renderChart(leftTeamStats)}
              </div>
            ) : (
              <p>No team stats to display. Click a team to show stats.</p>
            )}
          </div>
          {/* Right stats */}
          <div
            className="bg-gray-100 p-4 rounded-xl shadow-md"
            style={{ width: "520px" }}
          >
            <h2 className="text-xl font-bold mb-4">
              {rightTeamStats != null && rightTeamStats[0] != null
                ? rightTeamStats[0].teamName
                : ""}
            </h2>
            {rightTeamStats ? (
              <div>
                {renderTeamChart(rightTeamStatsLast10Games)}

                {renderChart(rightTeamStats)}
              </div>
            ) : (
              <p>No team stats to display. Click a team to show stats.</p>
            )}
          </div>
        </div>
      </div>
      <hr style={{ border: "1px solid #c0c0c0" }}></hr>
      <footer
        className="container-fluid bg-gray-800 mx-auto p-4 mt-8"
        style={{ fontStyle: "italic", textAlign: "center" }}
      >
        <p className="text-white text-center">
          For more information, visit{" "}
          <a
            href="https://www.nba.com"
            target="_blank"
            className="text-blue-400"
            rel="noreferrer"
          >
            NBA.com
          </a>
        </p>
      </footer>
      {loading && (
        <div className="loader-overlay">
          <div className="loader"></div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
