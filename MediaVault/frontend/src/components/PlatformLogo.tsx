"use client";

import { useState } from "react";
import { Globe } from "lucide-react";

interface PlatformLogoProps {
  platform: string;
  sourceDomain?: string;
  size?: number;
}

export function PlatformLogo({ platform, sourceDomain, size = 16 }: PlatformLogoProps) {
  const [imgError, setImgError] = useState(false);

  if (platform === "youtube") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0" aria-hidden="true">
        <rect x="2" y="4.5" width="20" height="15" rx="4.2" fill="#FF0000" />
        <polygon points="10,8.5 16.5,12 10,15.5" fill="#FFFFFF" />
      </svg>
    );
  }

  if (platform === "youtube_shorts") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0" aria-hidden="true">
        <path
          d="M16.7 3.2c1.4.8 1.9 2.6 1.1 4l-1.1 1.9 1.3.7c1.4.8 1.9 2.6 1.1 4l-3.8 6.6c-.8 1.4-2.6 1.9-4 1.1l-3.8-2.2c-1.4-.8-1.9-2.6-1.1-4l1.1-1.9-1.3-.7c-1.4-.8-1.9-2.6-1.1-4l3.8-6.6c.8-1.4 2.6-1.9 4-1.1l3.8 2.2z"
          fill="#FF0033"
        />
        <polygon points="10,8.5 15.5,12 10,15.5" fill="#FFFFFF" />
      </svg>
    );
  }

  if (platform === "tiktok") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#111111" />
        <path
          d="M14.5 6.2c.7 1.1 1.7 1.8 3 2v2.4c-1.1 0-2.1-.3-3-.9v4.7a4.3 4.3 0 1 1-3.7-4.2v2.5a1.8 1.8 0 1 0 1.3 1.7V6.2h2.4z"
          fill="#25F4EE"
          transform="translate(-0.4,-0.3)"
        />
        <path
          d="M14.5 6.2c.7 1.1 1.7 1.8 3 2v2.4c-1.1 0-2.1-.3-3-.9v4.7a4.3 4.3 0 1 1-3.7-4.2v2.5a1.8 1.8 0 1 0 1.3 1.7V6.2h2.4z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  if (platform === "instagram") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0" aria-hidden="true">
        <defs>
          <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F58529" />
            <stop offset="50%" stopColor="#DD2A7B" />
            <stop offset="100%" stopColor="#8134AF" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig-grad)" />
        <rect x="6.5" y="6.5" width="11" height="11" rx="3.2" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="2.7" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
        <circle cx="15.8" cy="8.2" r="0.9" fill="#FFFFFF" />
      </svg>
    );
  }

  if (platform === "facebook") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="#1877F2" />
        <path
          d="M13.5 19v-6h2l.3-2.3h-2.3V9.2c0-.7.2-1.1 1.1-1.1h1.3V6c-.2 0-1-.1-1.9-.1-1.9 0-3.1 1.1-3.1 3.2v1.6H9v2.3h2v6h2.5z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  if (platform === "twitter") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#0F1419" />
        <path
          d="M16.9 6.5h2.1l-4.6 5.3 5.4 7.2h-4.2l-3.3-4.3-3.8 4.3H6.4l4.9-5.6-5.2-6.9h4.3l3 4 3.5-4zm-.7 11.2h1.2L9.9 7.7H8.6l7.6 10z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  if (platform === "reddit") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="#FF4500" />
        <ellipse cx="12" cy="13.2" rx="5.2" ry="3.8" fill="#FFFFFF" />
        <circle cx="10.2" cy="13" r="0.9" fill="#FF4500" />
        <circle cx="13.8" cy="13" r="0.9" fill="#FF4500" />
      </svg>
    );
  }

  if (platform === "vimeo") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#1AB7EA" />
        <path d="M6.8 9.2l1.1 1.2s.8-.7 1.1-.4c.4.3 1.4 4.8 1.9 6 .4.9 1.6 1.9 3.1.9 1.5-1 4.6-4.7 4.7-7.7.1-2.5-2.6-2.9-4.1-1.3.7-.1 1.5.5.9 2-.6 1.5-1.7 2.8-2.1 2.8-.4 0-.8-1.9-1.1-3.3-.4-1.7-1.1-2.4-2.4-2.1-1.1.2-3.1 1.9-3.1 1.9z" fill="#FFFFFF" />
      </svg>
    );
  }

  const domain = (sourceDomain || "").trim();
  if (domain && domain !== "web" && !imgError) {
    return (
      <img
        src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`}
        alt={domain}
        width={size}
        height={size}
        onError={() => setImgError(true)}
        className="shrink-0 rounded-sm object-contain"
      />
    );
  }

  return <Globe style={{ width: size, height: size }} className="shrink-0 text-emerald-400" />;
}
