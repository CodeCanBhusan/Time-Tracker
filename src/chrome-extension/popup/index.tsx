import "../global.css";

import React, { useState, useEffect, useCallback } from "react";
import { useExtensionStorage } from "../hooks/useExtensionStorage";
import useCustomQuery from "../hooks/useCustomQuery";
import axios from "axios";

const baseUrl = "https://time-tracker-be-rei6.onrender.com/api";

// const baseUrl = "http://localhost:5000/api";

const toDatetimeLocal = (date: Date | string) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

interface projectType {
  _id: string;
  name: string;
}

interface TurnResponse {
  turn: "start" | "stop";
  startTime: string;
  endTime: string;
  remark: string;
  project: projectType;
  developer: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  timeSheet: {
    _id: string;
    startTime: string;
    endTime: string;
    remark: string;
    project: projectType;
  } | null;
}

export const Popup = () => {
  const { setItem, getItem } = useExtensionStorage();

  const [userToken, setUserToken] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [project, setProject] = useState<projectType | null>(null);
  const [remark, setRemark] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [started, setStarted] = useState(false);
  const [timeSheet, setTimeSheet] = useState<TurnResponse | null>(null);

  const { data: projectsList = [], isLoading: projectLoading } = useCustomQuery(
    `${baseUrl}/projects`
  );

  const {
    data: turnResponse,
    isLoading: turnLoading,
    error,
    refetch,
  } = useCustomQuery<TurnResponse>(
    `${baseUrl}/time-sheets/turn/${userToken}/${project?._id}`,
    {
      lazy: true,
    }
  );

  const isLoading = turnLoading || projectLoading;

  const setNow = useCallback((setter: (value: string) => void) => {
    setter(toDatetimeLocal(new Date()));
  }, []);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIndex = e.target.value;
    const selectedProject = projectOptions[parseInt(selectedIndex)];
    setProject(selectedProject);
    setItem("project", JSON.stringify(selectedProject));
    setTimeSheet(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserToken(e.target.value);
    setItem("username", e.target.value || "");
  };

  const projectOptions = React.useMemo(() => {
    if (projectLoading) return [];
    if (!projectsList || !Array.isArray(projectsList)) return [];
    return projectsList;
  }, [projectLoading, projectsList]);

  const handleToggleTimer = async () => {
    if (!userToken.trim()) {
      alert("Please enter your user token.");
      return;
    }

    if (!project) {
      alert("Please select a project.");
      return;
    }

    const message = {
      userToken: userToken?.trim(),
      project: project?._id,
      remark: remark,
      startTime,
      endTime,
    };

    const url = `${baseUrl}/time-sheets/turn/${userToken}/${project._id}`;

    if (timeSheet) {
      await axios.post(
        `${baseUrl}/time-sheets/${timeSheet?.timeSheet?._id}/end`,
        message
      );

      refetch(url);
      setRemark("");
      setTimeSheet(null);
      return;
    }

    await axios.post(`${baseUrl}/time-sheets/start`, message);
    setRemark("");
    refetch(url);
  };

  useEffect(() => {
    if (isLoading) return;
    if (!turnResponse) return;

    setName(turnResponse?.developer?.name || "Unknown User");

    if (turnResponse.turn === "start") {
      setStarted(false);
      setNow(setStartTime);
    }

    if (turnResponse.turn !== "start") {
      setStarted(true);
      setNow(setEndTime);
      setTimeSheet(turnResponse || null);
      setStartTime(
        toDatetimeLocal(
          new Date(turnResponse?.timeSheet?.startTime ?? new Date())
        )
      );
    }
  }, [isLoading, setNow, turnResponse]);

  useEffect(() => {
    getItem("username").then((stored) => {
      if (typeof stored === "string") setUserToken(stored);
    });

    getItem("project").then((stored) => {
      if (typeof stored === "string") setProject(JSON.parse(stored));
    });
  }, [getItem]);

  React.useEffect(() => {
    if (!userToken || userToken.trim().length !== 24) return;
    if (!project?._id) return;

    const url = `${baseUrl}/time-sheets/turn/${userToken}/${project._id}`;
    refetch(url);
  }, [project, refetch, userToken]);

  return (
    <div className="bg-white p-5 font-sans">
      <div className="max-w-lg mx-auto bg-white p-5 rounded-lg shadow-lg border border-gray-200">
        {/* Loader */}
        {isLoading && (
          <div className="text-center mb-5 font-bold text-gray-600">
            <div className="animate-pulse">⏳ Loading turn state...</div>
          </div>
        )}

        <h2 className="text-2xl font-semibold text-blue-600 mt-0 mb-5">
          Project Time Tracker
        </h2>

        {/* User Name Input */}
        <label className="block font-semibold mb-1 mt-4">
          User Token:{" "}
          <span className="text-sm text-gray-500">{!error && name}</span>
        </label>
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <input
              type={showPassword ? "text" : "password"}
              value={userToken}
              onChange={handleChange}
              placeholder="Your name"
              className="w-full p-2 pr-10 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => {
                setShowPassword(!showPassword);
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {showPassword ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-.722-3.25" />
                  <path d="M2 8a10.645 10.645 0 0 0 20 0" />
                  <path d="m20 15-1.726-2.05" />
                  <path d="m4 15 1.726-2.05" />
                  <path d="m9 18 .722-3.25" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          <button
            onClick={() => {
              setUserToken("");
              setItem("username", "");
            }}
            className="bg-red-500 text-white px-3 py-2 rounded font-bold hover:bg-red-600 transition-colors "
          >
            Clear
          </button>
        </div>

        {/* Project Selection */}
        <label className="block font-semibold mb-1">Project:</label>
        <select
          value={
            projectOptions
              .findIndex((proj) => proj._id === project?._id)
              .toString() ?? ""
          }
          onChange={handleProjectChange}
          className="w-full p-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {projectLoading ? (
            <option value="" disabled>
              Loading projects...
            </option>
          ) : (
            <>
              {projectOptions.map((proj, idx) => (
                <option key={proj._id} value={idx}>
                  {proj.name}
                </option>
              ))}
            </>
          )}
        </select>

        {/* Remarks */}
        {started && (
          <>
            <label className="block font-semibold mb-1">Remarks:</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Your notes..."
              className="w-full p-2 border border-gray-300 rounded mb-4 h-20 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </>
        )}

        {/* Time Inputs */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 flex flex-col">
            <label className="font-semibold mb-1">Start Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={started}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {started && (
            <div className="flex-1 flex flex-col">
              <label className="font-semibold mb-1">End Time</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Toggle Button */}
        {!error && (
          <button
            onClick={handleToggleTimer}
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded font-bold text-white text-lg transition-colors ${
              started
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {started ? "Stop Timer" : "Start Timer"}
          </button>
        )}
      </div>
    </div>
  );
};
