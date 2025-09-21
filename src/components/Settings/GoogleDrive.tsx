"use client";

import { useState, useEffect } from "react";
import {
  Cloud,
  CloudOff,
  Upload,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Trash2,
  User,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import {
  googleDriveSync,
  SyncStatus,
  SyncMetadata,
} from "@/lib/utils/google-drive";
// Removed @react-oauth/google import - using backend API now

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

  useEffect(() => {
    loadSyncStatus();
  }, []);

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
    try {
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: true,
        error: null,
        progress: 0,
      }));

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSyncStatus((prev) => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }));
      }, 200);

      await googleDriveSync.syncToDrive();

      clearInterval(progressInterval);
      setSyncStatus((prev) => ({ ...prev, progress: 100 }));

      // Reset progress after a short delay
      setTimeout(() => {
        setSyncStatus((prev) => ({ ...prev, isSyncing: false, progress: 0 }));
      }, 1000);

      // Only reload status after successful sync
      await loadSyncStatus();
    } catch (error) {
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        progress: 0,
        error: error instanceof Error ? error.message : "Sync to Drive failed",
      }));
      // Don't call loadSyncStatus() on error to prevent infinite re-renders
    }
  };

  const handleSyncFromDrive = async () => {
    try {
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: true,
        error: null,
        progress: 0,
      }));

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSyncStatus((prev) => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }));
      }, 200);

      await googleDriveSync.syncFromDrive();

      clearInterval(progressInterval);
      setSyncStatus((prev) => ({ ...prev, progress: 100 }));

      // Reset progress after a short delay
      setTimeout(() => {
        setSyncStatus((prev) => ({ ...prev, isSyncing: false, progress: 0 }));
      }, 1000);

      // Only reload status after successful sync
      await loadSyncStatus();
    } catch (error) {
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        progress: 0,
        error:
          error instanceof Error ? error.message : "Sync from Drive failed",
      }));
      // Don't call loadSyncStatus() on error to prevent infinite re-renders
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
      <div className="space-y-6">
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Cloud className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold">Google Drive Sync</h3>
            </div>
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Cloud className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold">Google Drive Sync</h3>
            {syncStatus.isAuthenticated ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <CloudOff className="w-5 h-5 text-neutral-400" />
            )}
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            Sync your chat data across devices using Google Drive. Your data is
            stored securely and only you have access to it.
          </p>

          {!syncStatus.isAuthenticated ? (
            <div className="space-y-3">
              <Button onClick={handleAuthenticate} className="w-full sm:w-auto">
                <Cloud className="w-4 h-4 mr-2" />
                Connect to Google Drive
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Connected to Google Drive
                </span>
                <Button onClick={handleDisconnect} variant="danger" size="sm">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Disconnect
                </Button>
              </div>

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
            </div>
          )}
        </div>
      </Card>

      {/* Account Info */}
      {syncStatus.isAuthenticated && userProfile && (
        <Card>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <User className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold">Account</h4>
            </div>
            <div className="flex items-center gap-3">
              {userProfile.picture ? (
                <img
                  src={userProfile.picture}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-sm font-mono">
                  {userProfile.name}
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 font-mono">
                  {userProfile.email}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Sync Controls */}
      {syncStatus.isAuthenticated && (
        <Card>
          <div className="p-4">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Sync Operations
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={handleSyncToDrive}
                disabled={syncStatus.isSyncing}
                variant="secondary"
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {syncStatus.isSyncing ? "Syncing..." : "Sync to Drive"}
              </Button>

              <Button
                onClick={handleSyncFromDrive}
                disabled={syncStatus.isSyncing}
                variant="secondary"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                {syncStatus.isSyncing ? "Syncing..." : "Sync from Drive"}
              </Button>
            </div>

            {syncStatus.isSyncing && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                  <span>Syncing...</span>
                  <span>{syncStatus.progress}%</span>
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${syncStatus.progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Error Display */}
      {syncStatus.error && (
        <Card className="rounded-xl border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">
                  Sync Error
                </h4>
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
