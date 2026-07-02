import React, { memo } from "react";
import { List } from "react-window";

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
  if (!items.length) return emptyState;

  return (
    <List
      className={className}
      rowComponent={MemoVirtualRow}
      rowCount={items.length}
      rowHeight={rowHeight}
      rowProps={{ items, renderItem }}
      overscanCount={overscanCount}
      style={{ height, width: "100%" }}
    />
  );
};

export default VirtualList;
