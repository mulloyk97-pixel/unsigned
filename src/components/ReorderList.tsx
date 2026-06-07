"use client";

import { useState } from "react";

// Touch-friendly vertical drag-to-reorder. The parent owns the order (`items`)
// and gets the new order via onReorder; this component only holds transient
// drag state, so there's no setState-in-effect syncing. No refs are used — the
// list container is found from the pointer event — to keep render ref-free.
//
// renderItem receives a `handle` prop to spread onto a drag-handle element.
export default function ReorderList({
  items,
  onReorder,
  renderItem,
}: {
  items: string[];
  onReorder: (next: string[]) => void;
  renderItem: (key: string, handle: HandleProps, dragging: boolean) => React.ReactNode;
}) {
  const [drag, setDrag] = useState<{ key: string; order: string[] } | null>(null);
  const order = drag ? drag.order : items;

  function rowMidpoints(fromEl: HTMLElement): { key: string; mid: number }[] {
    const container = fromEl.closest("[data-reorder-container]");
    if (!container) return [];
    return Array.from(container.querySelectorAll<HTMLElement>("[data-reorder-row]")).map((row) => {
      const r = row.getBoundingClientRect();
      return { key: row.dataset.key as string, mid: r.top + r.height / 2 };
    });
  }

  function makeHandle(key: string): HandleProps {
    return {
      onPointerDown: (e) => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setDrag({ key, order: [...items] });
      },
      onPointerMove: (e) => {
        if (!drag || drag.key !== key) return;
        const rows = rowMidpoints(e.currentTarget as HTMLElement);
        let target = rows.length - 1;
        for (let i = 0; i < rows.length; i++) {
          if (e.clientY < rows[i].mid) { target = i; break; }
        }
        const cur = drag.order.indexOf(key);
        if (target !== cur) {
          const next = [...drag.order];
          next.splice(cur, 1);
          next.splice(target, 0, key);
          setDrag({ key, order: next });
        }
      },
      onPointerUp: () => {
        if (!drag) return;
        onReorder(drag.order);
        setDrag(null);
      },
      onPointerCancel: () => setDrag(null),
    };
  }

  return (
    <div data-reorder-container className="flex flex-col gap-2">
      {order.map((key) => {
        const dragging = drag?.key === key;
        return (
          <div
            key={key}
            data-reorder-row
            data-key={key}
            className={dragging ? "opacity-90 scale-[1.01] shadow-md rounded-xl" : ""}
            style={{ touchAction: "none" }}
          >
            {renderItem(key, makeHandle(key), Boolean(dragging))}
          </div>
        );
      })}
    </div>
  );
}

export interface HandleProps {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
}
