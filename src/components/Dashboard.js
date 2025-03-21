import React, { useEffect, useState } from "react";
//import axios from "axios";
import api from "../services/axiosConfig.js";
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
  const [teams, setTeams] = useState([]);
  const [leftTeamStats, setLeftTeamStats] = useState(null);
  const [rightTeamStats, setRightTeamStats] = useState(null);
  const [lastColumn, setLastColumn] = useState("left");
  const [selectedLeftTeamId, setSelectedLeftTeamId] = useState(null);
  const [selectedRightTeamId, setSelectedRightTeamId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gameStats, setGameStats] = useState([]);
  const baseUrl = "http://localhost:5087";

  useEffect(() => {
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
  }, []);

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

  const handleTeamClick = (teamId) => {
    if (loading) return;
    if (lastColumn === "left") {
      fetchTeamStats(teamId, setLeftTeamStats, setSelectedLeftTeamId);
      setLastColumn("right");
    } else {
      fetchTeamStats(teamId, setRightTeamStats, setSelectedRightTeamId);
      setLastColumn("left");
    }
  };

  const renderChart = (teamStats) => {
    return teamStats.map((playerStats) => {
      const data = {
        labels: playerStats.pointsPerLast10Games.map((game) =>
          new Date(game.gameDate).toLocaleDateString()
        ),
        datasets: [
          {
            label: "Mins (Avg: " + playerStats.mins + ")",
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
                return `${new Date(game.gameDate).toLocaleDateString()} - ${
                  game.winOrLoss
                } - ${game.teamScore} - ${game.oppTeamName}`;
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

  return (
    <>
      <header className="container-fluid bg-gray-800 mx-auto p-4">
        <h1 className="text-white text-2xl font-bold text-center">NBA Teams</h1>
      </header>
      <hr style={{ border: "1px solid #c0c0c0" }}></hr>
      <div className="container mx-auto p-4" style={{ display: "flex" }}>
        <div>
          <ul className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-8">
            {teams.map((team) => (
              <li
                key={team.id}
                className={`cursor-pointer p-2 bg-gray-100 hover:bg-gray-200 rounded shadow ${
                  team.id === selectedLeftTeamId ||
                  team.id === selectedRightTeamId ||
                  loading
                    ? "cursor-not-allowed opacity-50"
                    : ""
                }`}
                onClick={() =>
                  !loading &&
                  team.id !== selectedLeftTeamId &&
                  team.id !== selectedRightTeamId &&
                  handleTeamClick(team.id)
                }
                style={{ width: "200px", textAlign: "center" }}
              >
                <img
                  src={team.logo}
                  alt={team.name}
                  className="w-12 h-12 mb-2 mx-auto"
                  style={{ width: "50px", height: "50px" }}
                />
                {gameStats[0] !== undefined &&
                  gameStats[0].teamInfo &&
                  gameStats[0].teamInfo
                    .filter((info) => info.abbr === team.abbr)
                    .map((info, index) => (
                      <div key={index} className="game-stats">
                        <p className="game-stats-title">Assist:</p>
                        <p className="game-stats-content">
                          {info.assistLeader}
                        </p>
                        <p className="game-stats-title">Point:</p>
                        <p className="game-stats-content">{info.pointLeader}</p>
                        <p className="game-stats-title">Reb:</p>
                        <p className="game-stats-content">
                          {info.reboundLeader}
                        </p>
                        <p className="game-stats-title">Date:</p>
                        <p className="game-stats-content">
                          {new Date(gameStats[0].gameDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
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
              renderChart(leftTeamStats)
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
              renderChart(rightTeamStats)
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
