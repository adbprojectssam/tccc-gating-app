/*
 * <license header>
 */

/**
 * Tiny bar histogram matching the Figma KPI sparkline: fixed 4px seafoam bars
 * with 1px gaps, bottom-aligned, plus a vertical "position in forecast range"
 * marker. No charting dependency — swap for a real chart lib later if needed.
 */
import { chartCaption } from './styles';

const HEIGHT = 48; // px — histogram area height

function MiniBars({ data = [], caption, ariaLabel, marker = 0.5 }) {
  const max = Math.max(...data, 1);

  return (
    <div className="es-minibars">
      <div className="es-minibars__hist" role="img" aria-label={ariaLabel || caption}>
        {data.map((value, index) => (
          <span
            key={index}
            className="es-minibars__bar"
            style={{ height: `${Math.max((value / max) * HEIGHT, 2)}px` }}
          />
        ))}
        {typeof marker === 'number' && (
          <span
            className="es-minibars__marker"
            style={{ left: `${Math.min(Math.max(marker, 0), 1) * 100}%` }}
            aria-hidden="true"
          />
        )}
      </div>
      {caption && <span className={`es-minibars__caption ${chartCaption}`}>{caption}</span>}
    </div>
  );
}

export default MiniBars;
