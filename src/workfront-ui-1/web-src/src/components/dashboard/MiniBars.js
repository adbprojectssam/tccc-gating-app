/*
 * <license header>
 */

/**
 * Tiny bar sparkline rendered as inline SVG from a numeric array.
 * No charting dependency — swap for a real chart lib later if needed.
 */
import { chartCaption } from './styles';

function MiniBars({ data = [], caption, ariaLabel }) {
  const width = 132;
  const height = 44;
  const gap = 2;
  const max = Math.max(...data, 1);
  const count = data.length || 1;
  const barWidth = (width - gap * (count - 1)) / count;

  return (
    <div className="es-minibars">
      <svg
        className="es-minibars__svg"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={ariaLabel || caption}
      >
        {data.map((value, index) => {
          const barHeight = Math.max((value / max) * height, 1);
          return (
            <rect
              key={index}
              className="es-minibars__bar"
              x={index * (barWidth + gap)}
              y={height - barHeight}
              width={barWidth}
              height={barHeight}
              rx="1"
            />
          );
        })}
      </svg>
      {caption && <span className={`es-minibars__caption ${chartCaption}`}>{caption}</span>}
    </div>
  );
}

export default MiniBars;
