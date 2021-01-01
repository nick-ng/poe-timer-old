import React from "react";

const SIZES = {
  1: {
    width: "170px",
    height: "62px",
  },
  2: {
    width: "170px",
    height: "98px",
  },
  3: {
    width: "350px",
    height: "220px",
  },
};

export default function PoeRacingWidget({ league, character, size }) {
  return league && character ? (
    <iframe
      src={`https://tracker.poe-racing.com/?event=${league}&character=${character}&size=${size}`}
      width={SIZES[size]?.width || "350px"}
      height={SIZES[size]?.height || "220px"}
    />
  ) : (
    <div />
  );
}
