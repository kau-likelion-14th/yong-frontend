import React from "react";

const StatCard = ({ stats }) => {
  const isThinText = stats.statistics.value === "토요일";

  return (
    <div className="stat-card">
      <div className="stat-icon">{stats.icon}</div>
      <div className="stat-title">{stats.title}</div>
      <div className="stat-value">
        <span className={isThinText ? 'thin-text' : ''}>
          {stats.statistics.value}
        </span>
        {stats.statistics.unit && (
          <span className="stat-unit">{stats.statistics.unit}</span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
