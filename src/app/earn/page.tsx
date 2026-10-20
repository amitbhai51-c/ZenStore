"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles,
  Coins,
  Clock,
  Play,
  Pause,
  Square,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  Info,
  RefreshCw,
} from "lucide-react";

interface EarningTask {
  id: string;
  title: string;
  description: string;
  linkUrl: string;
  rewardCoins: number;
  isCompletedToday: boolean;
}

export default function EarnPage() {
  const { user, refreshUser, isLoading } = useAuth();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  // AFK State
  const [afkActive, setAfkActive] = useState(false);
  const [afkPaused, setAfkPaused] = useState(false);
  const [afkSessionId, setAfkSessionId] = useState<string | null>(null);
  const [afkSeconds, setAfkSeconds] = useState(0);
  const [afkSessionCoins, setAfkSessionCoins] = useState(0);
  const [afkHeartbeatProgress, setAfkHeartbeatProgress] = useState(0);
  const [afkDailyEarned, setAfkDailyEarned] = useState(0);
  const [afkRemaining, setAfkRemaining] = useState(20);

  // Task State
  const [activeTaskSession, setActiveTaskSession] = useState<{
    taskId: string;
    sessionToken: string;
    title: string;
    linkUrl: string;
    rewardCoins: number;
    secondsLeft: number;
    readyToClaim: boolean;
  } | null>(null);
  const [claimingTask, setClaimingTask] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/earn/status");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setAfkDailyEarned(json.afk?.earnedToday || 0);
        setAfkRemaining(json.afk?.remainingAllowance || 0);
      }
    } catch {
      setError("Failed to load earning system status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // AFK Timer & Heartbeat Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (afkActive && !afkPaused && afkSessionId) {
      interval = setInterval(async () => {
        setAfkSeconds((prev) => prev + 1);

        // Every 60 seconds, trigger server heartbeat
        setAfkHeartbeatProgress((prev) => {
          if (prev >= 59) {
            // Send heartbeat
            (async () => {
              try {
                const res = await fetch("/api/earn/afk/heartbeat", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ sessionId: afkSessionId }),
                });
                const resData = await res.json();

                if (res.ok && resData.success) {
                  setAfkSessionCoins((c) => c + resData.coinsAwarded);
                  setAfkDailyEarned(resData.earnedToday);
                  setAfkRemaining(resData.remainingAllowance);
                  await refreshUser();

                  if (resData.dailyLimitReached) {
                    setAfkActive(false);
                    setNotification("Daily AFK limit reached! Coins added to your wallet.");
                  }
                } else if (resData.dailyLimitReached) {
                  setAfkActive(false);
                  setNotification(resData.message || "Daily AFK maximum reached.");
                }
              } catch (e) {
                console.error("Heartbeat sync error:", e);
              }
            })();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [afkActive, afkPaused, afkSessionId, refreshUser]);

  // Task countdown loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeTaskSession && activeTaskSession.secondsLeft > 0) {
      timer = setTimeout(() => {
        setActiveTaskSession((prev) => {
          if (!prev) return null;
          const next = prev.secondsLeft - 1;
          return {
            ...prev,
            secondsLeft: next,
            readyToClaim: next <= 0,
          };
        });
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [activeTaskSession]);

  // AFK Controls
  const handleStartAfk = async () => {
    if (afkRemaining <= 0) {
      setNotification("You have already reached your daily AFK limit for today.");
      return;
    }

    try {
      const res = await fetch("/api/earn/afk/start", { method: "POST" });
      const resData = await res.json();

      if (!res.ok) {
        setNotification(resData.error || "Failed to start AFK mode");
        return;
      }

      setAfkSessionId(resData.sessionId);
      setAfkActive(true);
      setAfkPaused(false);
      setAfkSeconds(0);
      setAfkSessionCoins(0);
      setAfkHeartbeatProgress(0);
      setNotification("AFK Earning started! Keep this tab open to accumulate coins.");
      setTimeout(() => setNotification(null), 4000);
    } catch {
      setNotification("Failed to start AFK session");
    }
  };

  const handlePauseAfk = () => {
    setAfkPaused(!afkPaused);
  };

  const handleStopAfk = async () => {
    try {
      await fetch("/api/earn/afk/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: afkSessionId }),
      });
    } finally {
      setAfkActive(false);
      setAfkPaused(false);
      setAfkSessionId(null);
      setNotification("AFK Session ended. Coins saved to your account.");
      setTimeout(() => setNotification(null), 4000);
      await refreshUser();
    }
  };

  // Task Controls
  const handleStartTask = async (task: EarningTask) => {
    if (task.isCompletedToday) return;

    try {
      const res = await fetch("/api/earn/task/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id }),
      });

      const resData = await res.json();

      if (!res.ok) {
        setNotification(resData.error || "Cannot start task");
        return;
      }

      // Open external partner link in new window
      window.open(task.linkUrl, "_blank", "noopener,noreferrer");

      // Start countdown
      setActiveTaskSession({
        taskId: task.id,
        sessionToken: resData.sessionToken,
        title: task.title,
        linkUrl: task.linkUrl,
        rewardCoins: resData.rewardCoins,
        secondsLeft: resData.requiredSeconds || 15,
        readyToClaim: false,
      });
    } catch {
      setNotification("Failed to initialize task");
    }
  };

  const handleClaimTask = async () => {
    if (!activeTaskSession || !activeTaskSession.readyToClaim || claimingTask) return;

    setClaimingTask(true);
    try {
      const res = await fetch("/api/earn/task/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken: activeTaskSession.sessionToken }),
      });

      const resData = await res.json();

      if (!res.ok) {
        setNotification(resData.error || "Failed to claim coins");
      } else {
        setNotification(resData.message || "+2 Coins added to your wallet!");
        setTimeout(() => setNotification(null), 4000);
        setActiveTaskSession(null);
        await refreshUser();
        await fetchStatus();
      }
    } catch {
      setNotification("Network error during task claim");
    } finally {
      setClaimingTask(false);
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#121624] border border-amber-500/50 text-amber-300 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-semibold">{notification}</span>
        </div>
      )}

      {/* Header & Balance Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[#181d2a]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Daily Free Rewards Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Earn Free Coins</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Complete daily sponsor tasks or idle in AFK mode to accumulate coins for the shop.
          </p>
        </div>

        {user ? (
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#0f131f] border border-amber-500/25">
            <div>
              <p className="text-xs text-zinc-400">Current Balance</p>
              <div className="flex items-center gap-2 text-2xl font-black text-amber-400">
                <Coins className="w-6 h-6 text-amber-400" />
                <span>{user.coinBalance.toLocaleString()}</span>
              </div>
            </div>
            <Link
              href="/shop"
              className="px-3.5 py-2 rounded-xl bg-[#141824] hover:bg-[#1a2030] text-zinc-200 border border-[#232b40] font-bold text-xs transition-colors shrink-0"
            >
              Go to Shop →
            </Link>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-[#0f131f] border border-[#1e2538] text-xs text-zinc-400">
            <Link href="/auth/login" className="text-amber-400 font-bold hover:underline">
              Sign In
            </Link>{" "}
            to start earning coins and saving them to your wallet.
          </div>
        )}
      </div>

      {/* Maintenance Mode Alert */}
      {data?.isMaintenance && (
        <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="text-xs">
            <p className="font-bold">Coin Earning is Under Scheduled Maintenance</p>
            <p className="text-amber-400/80 mt-0.5">
              Administrators are currently updating the reward endpoints. Reward claims are temporarily disabled.
            </p>
          </div>
        </div>
      )}

      {/* Earning Methods Grid */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Method A: AFK Earning Mode (Col 1-5) */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="p-6 rounded-2xl bg-[#0d101a] border border-[#1c2234] flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Method 1: AFK Mode
                </span>
                <span className="text-xs text-zinc-400">
                  Remaining: <strong className="text-white">{afkRemaining} coins</strong>
                </span>
              </div>

              <h2 className="text-xl font-bold text-white mb-1">Passive Idle Earning</h2>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Earn 1 coin per minute automatically. Keep this tab running in your browser while doing other work.
              </p>

              {/* Progress Bar towards daily limit */}
              <div className="mb-6 p-4 rounded-xl bg-[#121624] border border-[#1e2538]">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-zinc-400">Today&apos;s AFK Progress:</span>
                  <span className="text-amber-400 font-bold">
                    {afkDailyEarned} / {data?.afk?.dailyMax || 20} coins
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#1b2134] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (afkDailyEarned / (data?.afk?.dailyMax || 20)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Live Timer & Heartbeat Display */}
              <div className="p-6 rounded-2xl bg-[#101422] border border-[#20273c] text-center mb-6">
                <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 mb-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Session Elapsed Time</span>
                </div>
                <div className="text-5xl font-mono font-black text-white tracking-widest mb-3">
                  {formatTimer(afkSeconds)}
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-4">
                  <Coins className="w-3.5 h-3.5" />
                  <span>+{afkSessionCoins} coins earned this session</span>
                </div>

                {/* Heartbeat progress circle / bar */}
                {afkActive && (
                  <div className="mt-2 text-xs text-zinc-400">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>Next Coin Heartbeat:</span>
                      <span>{60 - afkHeartbeatProgress}s</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#1c2236] overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-1000"
                        style={{ width: `${(afkHeartbeatProgress / 60) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AFK Controls */}
            <div>
              {!afkActive ? (
                <button
                  onClick={handleStartAfk}
                  disabled={afkRemaining <= 0 || data?.isMaintenance}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Start AFK Earning</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handlePauseAfk}
                    className="py-3 rounded-xl bg-[#181d2e] hover:bg-[#22283d] text-zinc-200 border border-[#28324d] font-bold text-xs flex items-center justify-center gap-2"
                  >
                    {afkPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    <span>{afkPaused ? "Resume" : "Pause"}</span>
                  </button>

                  <button
                    onClick={handleStopAfk}
                    className="py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <Square className="w-4 h-4 fill-red-400" />
                    <span>Stop & Save</span>
                  </button>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-[11px] text-zinc-400 justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Anti-tamper server heartbeats active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Method B: Link Unlock Tasks (Col 6-12) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="p-6 rounded-2xl bg-[#0d101a] border border-[#1c2234] flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Method 2: Link Tasks
              </span>
              <span className="text-xs text-zinc-400">
                Daily Allowance:{" "}
                <strong className="text-white">
                  {data?.link?.earnedToday || 0} / {data?.link?.dailyMax || 40} coins
                </strong>
              </span>
            </div>

            <h2 className="text-xl font-bold text-white mb-1">Sponsored Daily Tasks</h2>
            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              Complete partner tasks to earn {data?.link?.rewardPerLink || 2} coins each. Click a task to open the link in a new tab, wait 15 seconds, and claim your coins.
            </p>

            {/* Active Challenge Drawer */}
            {activeTaskSession && (
              <div className="mb-6 p-5 rounded-2xl bg-[#141a2a] border border-amber-500/40 animate-slide-up">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Task in Progress
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    {activeTaskSession.secondsLeft > 0
                      ? `${activeTaskSession.secondsLeft}s left`
                      : "Challenge Complete!"}
                  </span>
                </div>

                <p className="text-sm font-bold text-white mb-1">{activeTaskSession.title}</p>
                <p className="text-xs text-zinc-400 mb-4">
                  Please keep the partner page open until the timer completes.
                </p>

                <div className="w-full h-2 rounded-full bg-[#1b2238] overflow-hidden mb-4">
                  <div
                    className="h-full bg-amber-400 transition-all duration-1000"
                    style={{
                      width: `${((15 - activeTaskSession.secondsLeft) / 15) * 100}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setActiveTaskSession(null)}
                    className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleClaimTask}
                    disabled={!activeTaskSession.readyToClaim || claimingTask}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {claimingTask ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Claim +{activeTaskSession.rewardCoins} Coins</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tasks List */}
            <div className="space-y-3 flex-1">
              {data?.link?.tasks?.map((task: EarningTask) => (
                <div
                  key={task.id}
                  className="p-4 rounded-xl bg-[#111420] border border-[#1e2538] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-bold text-white">{task.title}</p>
                      {task.isCompletedToday && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Completed Today
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-1">{task.description}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />+{task.rewardCoins}
                    </span>

                    <button
                      onClick={() => handleStartTask(task)}
                      disabled={task.isCompletedToday || data?.isMaintenance}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{task.isCompletedToday ? "Claimed" : "Open & Earn"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Verification explanation alert */}
            <div className="mt-6 p-4 rounded-xl bg-[#0c0f18] border border-[#181d2a] flex items-start gap-3 text-xs text-zinc-400">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p>
                Each external task issues a server-side session challenge and enforces a 15-second interaction timer before coins are awarded. Tasks reset daily at 00:00 server time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
