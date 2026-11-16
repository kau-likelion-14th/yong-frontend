import { useEffect, useState } from "react";
import StatCard from "./StatCard";
import { get } from "../../Api";
import config from "../../Config";

const weekdays = {
  MON: "월요일", TUE: "화요일", WED: "수요일", THU: "목요일",
  FRI: "금요일", SAT: "토요일", SUN: "일요일",
};

const Status = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    get(config.STATISTICS.GET, {}, { signal: controller.signal })
      .then((response) => {
        const result = response?.result;
        if (response?.isSuccess === false || !Number.isInteger(result?.streak) || result.streak < 0 ||
            !Number.isFinite(result?.monthPercent) || result.monthPercent < 0 || result.monthPercent > 100 ||
            (result.mostTodoWeek != null && !weekdays[result.mostTodoWeek])) {
          throw new Error("통계 응답을 확인하지 못했습니다.");
        }
        if (!controller.signal.aborted) setData(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setData(null);
          setError("통계를 불러오지 못했습니다.");
        }
      });
    return () => controller.abort();
  }, [retry]);

  const stats = [
    { icon: "🔥", title: "연속 달성일", statistics: { value: data?.streak ?? "-", unit: data ? "일" : "" } },
    { icon: "🎯", title: "최근 30일 달성률", statistics: { value: data?.monthPercent ?? "-", unit: data ? "%" : "" } },
    { icon: "⭐", title: "가장 많이 완료한 요일", statistics: { value: weekdays[data?.mostTodoWeek] ?? "-", unit: "" } },
  ];
  return (
    <section aria-label="활동 통계">
      {error && <div role="alert">{error} <button type="button" className="secondary-button" onClick={() => setRetry((value) => value + 1)}>다시 시도</button></div>}
      <div className="status-section">
        {stats.map((stat) => <StatCard key={stat.title} stats={stat} />)}
      </div>
    </section>
  );
};
export default Status;
