"use client";

import React, { useEffect, useState } from "react";
import type { ImageRecord } from "@/common/domain/dataset/types";
import { Badge } from "@/ui/components/common/Badge";
import { getDb } from "@/common/infrastructure/persistence/db";
import { BlobRepository } from "@/common/infrastructure/persistence/BlobRepository";

type Props = {
  image: ImageRecord;
  isActive: boolean;
  onClick: () => void;
};

export function ImageThumbnail({ image, isActive, onClick }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    const blobRepo = new BlobRepository(getDb());
    blobRepo.get(image.storedBlobKey).then((blob) => {
      if (blob) {
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      }
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [image.storedBlobKey]);

  const boxCount = image.annotations.length;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      aria-label={`${image.fileName}, ${image.split}, ${image.reviewState}, ${boxCount} box(es)`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 8px",
        borderRadius: 6,
        border: isActive ? "2px solid var(--color-primary, #F47B20)" : "2px solid transparent",
        background: isActive ? "var(--color-surface-active, #2d2d2d)" : "transparent",
        cursor: "pointer",
        width: "100%",
        textAlign: "left",
        color: "inherit",
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: 52,
          height: 40,
          borderRadius: 4,
          overflow: "hidden",
          flexShrink: 0,
          background: "#111",
        }}
      >
        {blobUrl && (
          <img
            src={blobUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {image.fileName}
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
          <Badge variant={image.split} />
          <Badge variant={image.reviewState} />
          {boxCount > 0 && (
            <span style={{ fontSize: 10, color: "#aaa" }}>{boxCount} box</span>
          )}
        </div>
      </div>
    </button>
  );
}
