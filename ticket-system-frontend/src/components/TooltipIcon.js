import React from "react";
import "./TooltipIcon.css";

const TooltipIcon = ({ text }) => {
  return (
    <div className="tooltip-wrapper">
      <span className="tooltip-icon">ⓘ</span>

      <div className="tooltip-box">
        {text}
      </div>
    </div>
  );
};

export default TooltipIcon;
