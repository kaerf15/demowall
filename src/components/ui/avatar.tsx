"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  className?: string;
}

export function Avatar({ src, alt, fallback, className, ...props }: AvatarProps) {
  const [hasError, setHasError] = React.useState(false);
  
  // Reset error state when src changes
  React.useEffect(() => {
    setHasError(false);
  }, [src]);

  const showImage = src && !hasError;

  return (
    <div
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      {showImage ? (
        <Image
          src={src}
          alt={alt || "Avatar"}
          fill
          className="object-cover"
          onError={(e) => {
            console.error("Avatar load error:", src, e);
            setHasError(true);
          }}
          sizes="40px"
          unoptimized={false} // Ensure optimization is used
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-muted bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-semibold">
          {fallback ? fallback.charAt(0).toUpperCase() : "?"}
        </div>
      )}
    </div>
  );
}
