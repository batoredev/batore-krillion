import { ALTITUDE_MARKERS, MAX_SCORE } from "@/game/tiers";
import { RocketIcon } from "./Logo";

/** Vertical altitude meter: 1 point = 1 km, 700 km at the top. */
export function AltitudeRail({ score }: { score: number }) {
  const pos = (km: number) => `calc(14px + (100% - 104px) * ${Math.min(km, MAX_SCORE) / MAX_SCORE})`;
  return (
    <aside className="rail" aria-label={`Altitude ${score} kilometres`}>
      <div className="rail-readout"><b className="mono">{score}</b><span>KM</span></div>
      <div className="rail-line" />
      {ALTITUDE_MARKERS.map((m) => (
        <div key={m.km} className="rail-marker" style={{ bottom: pos(m.km) }}>
          <i /><b>{m.km}</b><span>{m.label}</span>
        </div>
      ))}
      <div className="rail-rocket" style={{ bottom: pos(score) }}><RocketIcon size={30} /></div>
    </aside>
  );
}
