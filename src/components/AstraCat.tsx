/** Original 2D vector tabby cat. All motion is CSS (see .cat2d rules in styles.css). */
export function AstraCat() {
  return (
    <svg className="cat2d" viewBox="0 0 214 146" width="214" height="146" aria-hidden="true" focusable="false">
      <ellipse className="cat-shadow" cx="112" cy="131" rx="54" ry="6" />
      <g className="pose">
        {/* tail */}
        <g className="tail">
          <path d="M150 124 C170 124 184 112 180 92 C178 82 169 78 164 85" className="o-tail" />
          <path d="M150 124 C170 124 184 112 180 92 C178 82 169 78 164 85" className="f-tail" />
          <path d="M150 124 C170 124 184 112 180 92 C178 82 169 78 164 85" className="s-tail" />
        </g>
        <g className="breath">
          {/* body */}
          <path className="fur" d="M96 128 C90 108 92 84 108 72 C124 62 150 70 156 96 C159 112 156 124 150 128 Z" />
          <path className="stripe" d="M134 70 q6 6 4 14 M146 78 q6 6 3 16 M124 66 q4 5 3 12" />
          <ellipse className="cream-flat" cx="103" cy="102" rx="9" ry="21" />
          {/* far front leg */}
          <g className="legFar">
            <rect className="fur-dark" x="112" y="92" width="11" height="36" rx="5.5" />
            <ellipse className="cream" cx="117" cy="127.5" rx="9" ry="4.6" />
          </g>
          {/* haunch + back paw */}
          <g className="haunch">
            <ellipse className="fur" cx="138" cy="112" rx="20" ry="17" />
            <path className="stripe" d="M128 100 q5 4 4 11 M138 97 q5 5 3 12" />
            <ellipse className="cream" cx="127" cy="127.5" rx="13" ry="5.2" />
          </g>
          {/* near front leg (swats) */}
          <g className="legNear">
            <rect className="fur" x="98" y="90" width="12" height="38" rx="6" />
            <ellipse className="cream" cx="100" cy="127.5" rx="10" ry="5" />
            <path className="toe" d="M96 128 v-3 M100 128.5 v-3.5 M104 128 v-3" />
          </g>
        </g>
        {/* head */}
        <g className="head">
          <g className="earL">
            <path className="fur" d="M76 53 L78 29 L94 43 Z" />
            <path className="pink" d="M80 47 L81 36 L89 43 Z" />
          </g>
          <g className="earR">
            <path className="fur" d="M98 43 L114 30 L113 53 Z" />
            <path className="pink" d="M102 44 L108 38 L109 48 Z" />
          </g>
          <ellipse className="fur" cx="94" cy="62" rx="26" ry="22" />
          <path className="stripe thin" d="M94 41 v7 M88 42 l1 6 M100 42 l-1 6" />
          <ellipse className="cream-flat" cx="94" cy="72" rx="13" ry="9" />
          <ellipse className="blush" cx="77" cy="71" rx="4" ry="2.5" />
          <ellipse className="blush" cx="111" cy="71" rx="4" ry="2.5" />
          <g className="eyes">
            <ellipse className="eye-white" cx="84" cy="60" rx="6.2" ry="7" />
            <ellipse className="eye-white" cx="104" cy="60" rx="6.2" ry="7" />
            <g className="pupils">
              <ellipse className="iris" cx="84" cy="61" rx="4.3" ry="5.3" />
              <ellipse className="iris" cx="104" cy="61" rx="4.3" ry="5.3" />
              <ellipse className="pupil" cx="84" cy="61" rx="2" ry="4.4" />
              <ellipse className="pupil" cx="104" cy="61" rx="2" ry="4.4" />
              <circle className="glint" cx="82.6" cy="58.4" r="1.5" />
              <circle className="glint" cx="102.6" cy="58.4" r="1.5" />
            </g>
          </g>
          <path className="nose" d="M91.5 68.4 h5 l-2.5 3.1 z" />
          <path className="mouth" d="M94 71.5 v2 M94 73.5 q-3.5 3 -6.5 0 M94 73.5 q3.5 3 6.5 0" />
          <ellipse className="mouth-open" cx="94" cy="76.5" rx="4.2" ry="3.6" />
          <path className="whisker" d="M78 69 l-15 -3 M78 72 l-16 1 M79 75 l-14 6 M110 69 l15 -3 M110 72 l16 1 M109 75 l14 6" />
        </g>
      </g>
      {/* ball */}
      <g className="ball">
        <g className="ball-spin">
          <circle className="ball-body" cx="68" cy="119" r="10" />
          <path className="ball-patch" d="M68 114 L72.8 117.5 L71 123.2 L65 123.2 L63.2 117.5 Z" />
          <path className="ball-seam" d="M68 114 V109.5 M72.8 117.5 L77.2 116 M71 123.2 L73.8 127 M65 123.2 L62.2 127 M63.2 117.5 L58.8 116" />
        </g>
      </g>
    </svg>
  );
}
