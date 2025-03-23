"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

interface CardProps {
  title?: string;
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
  linkUrl?: string;
  children?: React.ReactNode;
}

export function Card({
  title,
  description,
  imageSrc,
  imageAlt,
  linkUrl,
  children,
}: CardProps) {
  const CardContent = (
    <div
      className={
        "relative border rounded-lg shadow-md dark:bg-gray-800 flex flex-col transition hover:shadow-lg"
      }
    >
      {/* Image (Top Right, Max 25% Width) */}
      {imageSrc && (
        <div className="absolute top-2 right-2 w-1/4 max-w-[100px]">
          <Image
            src={imageSrc}
            alt={imageAlt || "Card image"}
            width={100}
            height={100}
            className="rounded-lg"
          />
        </div>
      )}

      {/* Content */}
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      )}
      <div >{children}</div>
    </div>
  );

  return linkUrl ? <Link href={linkUrl}>{CardContent}</Link> : CardContent;
}
