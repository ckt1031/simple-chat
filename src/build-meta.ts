import { execSync } from "node:child_process";
import packageJson from "../package.json";

export default function getBuildMetadata() {
  const buildDate = new Date().toISOString();

  let gitCommit = "";
  let versionCode = "";

  try {
    gitCommit = execSync("git rev-parse HEAD").toString().trim();
  } catch {
    // ignore
  }
  try {
    versionCode = execSync("git rev-list --count HEAD").toString().trim();
  } catch {
    // ignore
  }

  // Short hash for display purposes
  const shortCommit = gitCommit ? gitCommit.substring(0, 7) : "unknown";

  // App and framework versions
  const appVersion: string = packageJson.version;
  const nextVersion: string = packageJson.dependencies.next;

  return {
    NEXT_PUBLIC_BUILD_DATE: buildDate,
    NEXT_PUBLIC_GIT_COMMIT: shortCommit,
    NEXT_PUBLIC_VERSION_CODE: versionCode || "0",
    NEXT_PUBLIC_APP_VERSION: appVersion,
    NEXT_PUBLIC_NEXT_VERSION: nextVersion,
    NEXT_PUBLIC_NODE_VERSION: process.version,
  } as Record<string, string>;
}
