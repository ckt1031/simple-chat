"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Download, RefreshCw, AlertCircle, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import {
  googleDriveSync,
  SyncStatus,
  SyncMetadata,
} from "@/lib/utils/google-drive";
// Removed @react-oauth/google import - using backend API now

interface SyncLog {
  message: string;
  timestamp: number;
}

export default function GoogleDriveSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isAuthenticated: false,
    isSyncing: false,
    lastSyncTime: null,
    error: null,
    progress: 0,
  });
  const [syncMetadata, setSyncMetadata] = useState<SyncMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<{
    id: string;
    email: string;
    name: string;
    picture?: string;
    verified_email: boolean;
  } | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSyncStatus();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new logs are added
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [syncLogs]);

  const addLog = (message: string) => {
    setSyncLogs((prev) => [...prev, { message, timestamp: Date.now() }]);
  };

  const clearLogs = () => {
    setSyncLogs([]);
  };

  const loadSyncStatus = async () => {
    try {
      setIsLoading(true);
      const [status, metadata, profile] = await Promise.all([
        googleDriveSync.getSyncStatus(),
        googleDriveSync.getSyncMetadata(),
        googleDriveSync.getUserProfile(),
      ]);
      setSyncStatus(status);
      setSyncMetadata(metadata);
      setUserProfile(profile || null);
    } catch (error) {
      setSyncStatus((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to load sync status",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthenticate = async () => {
    try {
      setSyncStatus((prev) => ({ ...prev, error: null }));
      await googleDriveSync.authenticate();
      await loadSyncStatus();
    } catch (error) {
      setSyncStatus((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Authentication failed",
      }));
    }
  };

  const handleDisconnect = async () => {
    if (
      !confirm(
        "Are you sure you want to disconnect from Google Drive? This will remove all sync data.",
      )
    ) {
      return;
    }

    try {
      setSyncStatus((prev) => ({ ...prev, error: null }));
      await googleDriveSync.disconnect();
      setUserProfile(null); // Reset user profile
      await loadSyncStatus();
    } catch (error) {
      setSyncStatus((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to disconnect",
      }));
    }
  };

  const handleSyncToDrive = async () => {
    if (
      !confirm(
        "Upload your local data to Google Drive? This will overwrite the remote data.",
      )
    ) {
      return;
    }

    clearLogs();

    try {
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: true,
        error: null,
        progress: 0,
      }));

      // Intercept console.log to capture sync operations
      const originalLog = console.log;
      console.log = (...args: unknown[]) => {
        const message = args
          .map((arg) =>
            typeof arg === "object" ? JSON.stringify(arg) : String(arg),
          )
          .join(" ");
        addLog(message);
        originalLog.apply(console, args);
      };

      try {
        addLog("Starting sync to Google Drive...");
        await googleDriveSync.syncToDrive();
        addLog("Sync completed successfully!");
      } finally {
        // Restore original console.log
        console.log = originalLog;
      }

      setSyncStatus((prev) => ({ ...prev, progress: 100 }));

      // Reset after delay
      setTimeout(() => {
        setSyncStatus((prev) => ({ ...prev, isSyncing: false, progress: 0 }));
      }, 2000);

      await loadSyncStatus();
    } catch (error) {
      addLog(
        `Error: ${error instanceof Error ? error.message : "Sync failed"}`,
      );
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        progress: 0,
        error: error instanceof Error ? error.message : "Sync to Drive failed",
      }));
    }
  };

  const handleSyncFromDrive = async () => {
    if (
      !confirm(
        "Download data from Google Drive? This will overwrite your local data.",
      )
    ) {
      return;
    }

    clearLogs();

    try {
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: true,
        error: null,
        progress: 0,
      }));

      // Intercept console.log to capture sync operations
      const originalLog = console.log;
      console.log = (...args: unknown[]) => {
        const message = args
          .map((arg) =>
            typeof arg === "object" ? JSON.stringify(arg) : String(arg),
          )
          .join(" ");
        addLog(message);
        originalLog.apply(console, args);
      };

      try {
        addLog("Starting sync from Google Drive...");
        await googleDriveSync.syncFromDrive();
        addLog("Sync completed successfully!");
      } finally {
        // Restore original console.log
        console.log = originalLog;
      }

      setSyncStatus((prev) => ({ ...prev, progress: 100 }));

      // Reset after delay
      setTimeout(() => {
        setSyncStatus((prev) => ({ ...prev, isSyncing: false, progress: 0 }));
      }, 2000);

      await loadSyncStatus();
    } catch (error) {
      addLog(
        `Error: ${error instanceof Error ? error.message : "Sync failed"}`,
      );
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        progress: 0,
        error:
          error instanceof Error ? error.message : "Sync from Drive failed",
      }));
    }
  };

  const formatLastSyncTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-3">Google Drive Sync</h3>
          <div className="animate-pulse space-y-2">
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-3">Google Drive Sync</h3>

          {!syncStatus.isAuthenticated ? (
            <div className="space-y-3">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Sync your chat data across devices using Google Drive.
              </p>
              <Button onClick={handleAuthenticate}>
                Connect to Google Drive
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Account info inline */}
              {userProfile && (
                <div className="flex items-center md:flex-row gap-4 flex-col justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center gap-2">
                    {userProfile.picture && (
                      <img
                        src={userProfile.picture}
                        alt="Profile"
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <div className="text-sm">
                      <p className="font-bold font-mono">{userProfile.email}</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleDisconnect}
                    variant="danger"
                    size="sm"
                    className="w-full md:w-auto"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Disconnect
                  </Button>
                </div>
              )}

              {/* Sync info */}
              {syncMetadata && (
                <div className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                  <p>
                    Last sync:{" "}
                    {syncStatus.lastSyncTime
                      ? formatLastSyncTime(syncStatus.lastSyncTime)
                      : "Never"}
                  </p>
                  <p>Local version: {syncMetadata.localVersion}</p>
                  <p>Remote version: {syncMetadata.remoteVersion}</p>
                </div>
              )}

              {/* Sync buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleSyncToDrive}
                  disabled={syncStatus.isSyncing}
                  variant="secondary"
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>

                <Button
                  onClick={handleSyncFromDrive}
                  disabled={syncStatus.isSyncing}
                  variant="secondary"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>

              {/* Sync console */}
              {(syncStatus.isSyncing || syncLogs.length > 0) && (
                <div className="border-2 border-neutral-200 dark:border-neutral-700 rounded-lg">
                  <div className="flex items-center justify-between px-3 py-1.5 border-b-2 border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 rounded-t-lg">
                    <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                      Sync Console
                    </span>
                    {syncStatus.isSyncing && (
                      <span className="text-xs text-neutral-600 dark:text-neutral-400">
                        Syncing...
                      </span>
                    )}
                  </div>
                  <div className="p-2 max-h-32 overflow-y-auto font-mono text-xs space-y-0.5">
                    {syncLogs.map((log, index) => (
                      <div
                        key={index}
                        className="text-neutral-700 dark:text-neutral-300"
                      >
                        <span className="text-neutral-500 dark:text-neutral-500">
                          [
                          {new Date(log.timestamp).toLocaleTimeString(
                            ["en-US"],
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                          ]
                        </span>{" "}
                        {log.message}
                      </div>
                    ))}
                    <div ref={consoleEndRef} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Error Display */}
      {syncStatus.error && (
        <Card className="rounded-xl border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <div className="p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-700 dark:text-red-300">
                  {syncStatus.error}
                </p>
                <Button
                  onClick={loadSyncStatus}
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
