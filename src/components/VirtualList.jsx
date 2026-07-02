import React, { memo, useMemo, useState } from "react";

const VirtualRow = ({ ariaAttributes, index, items, renderItem, style }) => (
  <div {...ariaAttributes} style={style}>
    {renderItem(items[index], index)}
  </div>
);

const MemoVirtualRow = memo(VirtualRow);

const VirtualList = ({
  items = [],
  height = 560,
  rowHeight = 88,
  renderItem,
  className = "",
  overscanCount = 6,
  emptyState = null,
}) => {
  const [scrollTop, setScrollTop] = useState(0);

  const safeRowHeight = Math.max(1, Number(rowHeight) || 88);
  const safeHeight = Math.max(1, Number(height) || 560);
  const totalHeight = items.length * safeRowHeight;

  const { startIndex, visibleItems } = useMemo(() => {
    const visibleCount = Math.ceil(safeHeight / safeRowHeight);
    const start = Math.max(0, Math.floor(scrollTop / safeRowHeight) - overscanCount);
    const end = Math.min(items.length, start + visibleCount + overscanCount * 2);

    return {
      startIndex: start,
      visibleItems: items.slice(start, end),
    };
  }, [items, overscanCount, safeHeight, safeRowHeight, scrollTop]);

  if (!items.length) return emptyState;

  return (
    <div
      className={className}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      style={{ height: safeHeight, width: "100%", overflowY: "auto" }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {visibleItems.map((item, offset) => {
          const index = startIndex + offset;
          return (
            <MemoVirtualRow
              key={item?._id || item?.id || index}
              ariaAttributes={{
                "aria-posinset": index + 1,
                "aria-setsize": items.length,
                role: "listitem",
              }}
              index={index}
              items={items}
              renderItem={renderItem}
              style={{
                height: safeRowHeight,
                left: 0,
                position: "absolute",
                right: 0,
                top: index * safeRowHeight,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default VirtualList;
