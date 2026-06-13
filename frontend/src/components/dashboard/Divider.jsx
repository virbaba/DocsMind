import React from 'react';

const Divider = ({ onMouseDown }) => (
  <div
    onMouseDown={onMouseDown}
    className="w-1 shrink-0 bg-[#1c1f30] hover:bg-[#5b4fd4]/60 cursor-col-resize transition-colors duration-150 active:bg-[#5b4fd4] relative group"
    style={{ zIndex: 20 }}
  >
    <div className="absolute inset-y-0 -left-1 -right-1" />
    {/* Center drag handle dots */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {[0, 1, 2].map((i) => (
        <div key={i} className="w-1 h-1 rounded-full bg-[#5b4fd4]" />
      ))}
    </div>
  </div>
);

export default Divider;
