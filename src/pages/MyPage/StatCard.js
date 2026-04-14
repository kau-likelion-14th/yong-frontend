import React from 'react';

const StatCard = ({ stats }) => {
    const { icon, title, statistics } = stats;
    const isThinText = statistics.value === "토요일";

    return (
        <div className="stat-card">
            <div className="stat-top">
                <span className="stat-icon">{icon}</span>
                <span className="stat-title">{title}</span>
            </div>
            <div className="stat-bottom">
                <span className={`stat-value ${isThinText ? 'thin-text' : ''}`}>{statistics.value}</span>
                {statistics.unit && <span className="stat-unit">{statistics.unit}</span>}
            </div>
        </div>
    );
};

export default StatCard;
