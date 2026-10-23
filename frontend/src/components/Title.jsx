import React from "react";

const Title = ({ text1, text2 }) => {
  return (
    <div className="mb-2 flex flex-col items-center gap-2">
      <h2 className="text-center">
        <span className="block text-[11px] font-medium uppercase tracking-[0.32em] text-[#8A8178]">
          {text1}
        </span>
        <span className="prata-regular mt-1 block text-3xl text-[#1C1917] sm:text-4xl">
          {text2}
        </span>
      </h2>
      <span className="mt-1 h-px w-12 bg-[#7A3030]" />
    </div>
  );
};

export default Title;
