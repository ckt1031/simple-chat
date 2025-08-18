'use client';

export default function AboutTab() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">About</h3>
      <div className="space-y-2 text-sm text-neutral-700 dark:text-neutral-200">
        <p>
          Simple Chat is a lightweight chat UI built with Next.js, Tailwind CSS, and TypeScript.
        </p>
        <p>
          Theme and appearance settings are stored locally in your browser.
        </p>
      </div>
      <div className="text-xs text-neutral-500 dark:text-neutral-400">
        <p>
          © {new Date().getFullYear()} Simple Chat
        </p>
      </div>
    </div>
  );
}
