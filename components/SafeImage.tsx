"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";

// Self-healing image. A screenshot that fails once — a cold image
// optimizer still transcoding, a slow database read behind /api/images,
// a brief network reset on the visitor's phone — must not sit broken
// until someone refreshes by hand: browsers never retry a failed <img>
// on their own, which is exactly the "sometimes the picture is missing,
// refresh and it appears" behaviour this replaces.
//
// The ladder: try the optimized variant, retry it twice with a short
// backoff (a fresh query makes the optimizer re-fetch and re-transcode
// instead of repeating a cached failure), then fall back to the
// original full-size source served directly. Only a source that is
// itself unreachable leaves the frame empty.
//
// Compression rule (Krrish's standing instruction, 2026-11-28): every
// screenshot — uploaded to the database or pasted as an external URL —
// is displayed through the optimizer, so files shrink automatically,
// but the ORIGINALS are never altered (uploads stay byte-identical in
// the database, URL images stay at their source, and the lightbox
// opens the untouched original). The optimizer quality defaults to 90
// here so the displayed copy stays visually identical to the original
// — scoreboard text included — while still weighing far less.
export default function SafeImage({
  src,
  onError,
  quality,
  ...rest
}: ImageProps) {
  const [attempt, setAttempt] = useState(0);
  const timer = useRef<number | null>(null);

  // A different record reusing this mounted component starts the
  // ladder from the top.
  useEffect(() => {
    setAttempt(0);
  }, [src]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  if (typeof src !== "string") {
    return <Image src={src} onError={onError} {...rest} />;
  }

  const attemptSrc =
    attempt === 0
      ? src
      : `${src}${src.includes("?") ? "&" : "?"}synretry=${attempt}`;

  return (
    <Image
      src={attemptSrc}
      quality={quality ?? 90}
      unoptimized={attempt >= 3}
      onError={(e) => {
        onError?.(e);
        if (attempt < 3) {
          timer.current = window.setTimeout(
            () => setAttempt((a) => a + 1),
            500 * (attempt + 1),
          );
        }
      }}
      {...rest}
    />
  );
}
