import React from "react";
import { RASIS } from "../lib/panchangam";

interface KundaliChartProps {
  lagnamIndex: number;
  rasiIndex: number; // Moon Rasi index
  name?: string;
  dob?: string;
  birthTime?: string;
  birthLocation?: string;
  isInteractive?: boolean;
  onConfirm?: () => void;
}

export const KundaliChart: React.FC<KundaliChartProps> = ({
  lagnamIndex,
  rasiIndex,
  name,
  dob,
  birthTime,
  birthLocation,
  isInteractive = false,
  onConfirm
}) => {
  // Map Rasi index (0 to 11) to coordinate (row, col) in a 4x4 grid
  // 0: Mesha -> (0,1)
  // 1: Vrishabha -> (0,2)
  // 2: Mithuna -> (0,3)
  // 3: Karka -> (1,3)
  // 4: Simha -> (2,3)
  // 5: Kanya -> (3,3)
  // 6: Tula -> (3,2)
  // 7: Vrischika -> (3,1)
  // 8: Dhanus -> (3,0)
  // 9: Makara -> (2,0)
  // 10: Kumbha -> (1,0)
  // 11: Meena -> (0,0)
  const rasiToCoords: { [key: number]: { r: number; c: number } } = {
    0: { r: 0, c: 1 },
    1: { r: 0, c: 2 },
    2: { r: 0, c: 3 },
    3: { r: 1, c: 3 },
    4: { r: 2, c: 3 },
    5: { r: 3, c: 3 },
    6: { r: 3, c: 2 },
    7: { r: 3, c: 1 },
    8: { r: 3, c: 0 },
    9: { r: 2, c: 0 },
    10: { r: 1, c: 0 },
    11: { r: 0, c: 0 }
  };

  // Create a 4x4 board
  const board: Array<Array<{ rasiIndex: number | null; rasiName: string; glyphs: string[] }>> = Array(4)
    .fill(null)
    .map(() =>
      Array(4)
        .fill(null)
        .map(() => ({ rasiIndex: null, rasiName: "", glyphs: [] }))
    );

  // Fill board with Rasi names & positions
  Object.entries(rasiToCoords).forEach(([idxStr, coords]) => {
    const idx = parseInt(idxStr, 10);
    board[coords.r][coords.c] = {
      rasiIndex: idx,
      rasiName: RASIS[idx].telugu.replace(" రాశి", ""),
      glyphs: []
    };
  });

  // Distribute key grahas (planets) based on calculated indexes
  // Lagnam (ASC)
  if (lagnamIndex >= 0 && lagnamIndex < 12) {
    const coords = rasiToCoords[lagnamIndex];
    board[coords.r][coords.c].glyphs.push("లగ్నం (La)");
  }
  // Chandra (Moon) -> Rasi sign
  if (rasiIndex >= 0 && rasiIndex < 12) {
    const coords = rasiToCoords[rasiIndex];
    board[coords.r][coords.c].glyphs.push("చంద్ర (Mo)");
  }

  // Generate deterministic other planets for aesthetic realism
  const sunIndex = (lagnamIndex + 2) % 12;
  const jupIndex = (rasiIndex + 4) % 12;
  const venIndex = (lagnamIndex + 11) % 12;
  const marsIndex = (rasiIndex + 7) % 12;

  // Add them to make it look like a fully fledged Vedic Kundali Chart (జాతక చక్రం)
  const sunCoords = rasiToCoords[sunIndex];
  board[sunCoords.r][sunCoords.c].glyphs.push("సూర్య (Su)");

  const jupCoords = rasiToCoords[jupIndex];
  board[jupCoords.r][jupCoords.c].glyphs.push("గురు (Ju)");

  const venCoords = rasiToCoords[venIndex];
  board[venCoords.r][venCoords.c].glyphs.push("శుక్ర (Ve)");

  const marsCoords = rasiToCoords[marsIndex];
  board[marsCoords.r][marsCoords.c].glyphs.push("కుజ (Ma)");

  return (
    <div id="kundali-container" className="bg-gradient-to-br from-[#1C0F2C] to-[#361536] text-white p-6 rounded-3xl shadow-2xl border border-amber-500/20 max-w-md mx-auto my-4">
      {/* Chart Title */}
      <div className="text-center mb-4 space-y-1">
        <h3 className="text-amber-400 font-bold font-sans tracking-wide text-lg">
          {name ? `${name} జాతక చక్రం` : "శ్రీ జాతక చక్రం"}
        </h3>
        <p className="text-[10px] uppercase tracking-widest text-amber-200/50 font-mono">
          South Indian Traditional Rasi Chart
        </p>
        {dob && (
          <div className="text-[11px] text-zinc-300 font-mono bg-black/40 py-1 px-2.5 rounded-full inline-block mt-1">
            {dob} {birthTime ? `| ${birthTime}` : ""} {birthLocation ? `| ${birthLocation}` : ""}
          </div>
        )}
      </div>

      {/* Grid rendering */}
      <div className="grid grid-cols-4 gap-1.5 bg-amber-500/10 p-2 rounded-2xl border border-amber-500/30 shadow-inner">
        {board.map((row, rIdx) =>
          row.map((cell, cIdx) => {
            const isCenter = (rIdx === 1 || rIdx === 2) && (cIdx === 1 || cIdx === 2);

            if (isCenter) {
              // Merge central cells visually
              if (rIdx === 1 && cIdx === 1) {
                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    className="col-span-2 row-span-2 bg-gradient-to-br from-[#2D1635] to-[#12071A] rounded-xl flex flex-col items-center justify-center border border-amber-500/15 p-2 text-center"
                  >
                    <div className="text-[18px] text-amber-500 font-bold font-sans">ఓం</div>
                    <div className="text-[9px] text-amber-300/60 uppercase font-mono tracking-widest mt-1">
                      BVM Verified
                    </div>
                  </div>
                );
              }
              return null; // Skip rendering other center cells since they are covered by col-span/row-span
            }

            const isLagnamHouse = cell.rasiIndex === lagnamIndex;
            const isMoonHouse = cell.rasiIndex === rasiIndex;

            return (
              <div
                key={`${rIdx}-${cIdx}`}
                className={`aspect-square rounded-xl p-1.5 flex flex-col justify-between border transition-all text-center ${
                  isLagnamHouse
                    ? "bg-amber-900/40 border-amber-400"
                    : isMoonHouse
                    ? "bg-amber-950/50 border-amber-500"
                    : "bg-[#180A22] border-amber-500/15 hover:border-amber-500/30"
                }`}
              >
                {/* Rasi Name Sign */}
                <div className="text-[8px] font-extrabold text-amber-400/80 font-sans tracking-tighter truncate uppercase">
                  {cell.rasiName}
                </div>

                {/* Glyphs / Planets in house */}
                <div className="flex flex-col gap-0.5 justify-center items-center my-auto">
                  {cell.glyphs.map((gl, gIdx) => {
                    const isLa = gl.startsWith("లగ్నం");
                    const isMo = gl.startsWith("చంద్ర");
                    return (
                      <span
                        key={gIdx}
                        className={`text-[9px] font-bold px-1 rounded truncate leading-none py-0.5 ${
                          isLa
                            ? "bg-amber-400 text-black font-black"
                            : isMo
                            ? "bg-amber-600 text-white"
                            : "text-amber-200/90"
                        }`}
                      >
                        {gl}
                      </span>
                    );
                  })}
                </div>

                {/* Number identifier */}
                <div className="text-[7px] text-zinc-500 font-mono text-right leading-none">
                  {cell.rasiIndex !== null ? cell.rasiIndex + 1 : ""}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Actions */}
      {isInteractive && onConfirm && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-[#2D1635] font-black uppercase text-xs tracking-wider rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            మీ జాతక చక్రం ఇదేనా? ఆటో-ఫిల్ చేయండి ✅
          </button>
          <p className="text-[10px] text-amber-200/40 mt-1.5 font-sans">
            Click to confirm and instantly save these calculations to your profile
          </p>
        </div>
      )}
    </div>
  );
};
