import { memo } from "react";

function isoToLocalized(iso: string | undefined) {
  if (!iso) return "Unknown";

  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function VersionBlock() {
  const info = [
    {
      label: "Next.js",
      value: process.env.NEXT_PUBLIC_NEXT_VERSION,
    },
    {
      label: "Build Date",
      value: isoToLocalized(process.env.NEXT_PUBLIC_BUILD_DATE),
    },
    {
      label: "Git Commit",
      value: process.env.NEXT_PUBLIC_GIT_COMMIT,
    },
    {
      label: "Version Code",
      value: process.env.NEXT_PUBLIC_VERSION_CODE,
    },
    {
      label: "App Version",
      value: process.env.NEXT_PUBLIC_APP_VERSION,
    },
    {
      label: "Node.js",
      value: process.env.NEXT_PUBLIC_NODE_VERSION,
    },
  ];

  return (
    <div className="text-sm">
      <h4 className="font-medium text-neutral-700 dark:text-neutral-200">
        Site information
      </h4>
      <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-neutral-600 dark:text-neutral-400 lg:grid-cols-2">
        {info.map((item) => (
          <div
            key={item.label}
            className="flex items-baseline justify-between border-b border-neutral-200 pb-1 dark:border-neutral-800"
          >
            <dt className="text-xs tracking-wide">{item.label}</dt>
            <dd className="text-sm tabular-nums font-mono">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default memo(VersionBlock);
