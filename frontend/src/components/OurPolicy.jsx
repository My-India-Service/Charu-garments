import React from "react";
import { ShieldCheck, Headset, BadgeCheck } from "lucide-react";

const policies = [
  {
    icon: BadgeCheck,
    title: "Quality assurance",
    desc: "Every product is checked for quality before it reaches you.",
  },
  {
    icon: ShieldCheck,
    title: "Secure payments",
    desc: "Your payments are encrypted and protected at every step.",
  },
  {
    icon: Headset,
    title: "24/7 support",
    desc: "Our team is available around the clock to help with anything.",
  },
];

const OurPolicy = () => {
  return (
    <div className="my-16 grid grid-cols-1 gap-4 sm:my-20 sm:grid-cols-3">
      {policies.map(({ icon: Icon, title, desc }) => (
        <div
          key={title}
          className="flex items-start gap-4 rounded-2xl border border-[#E6DFD6] bg-[#FBF9F6] px-6 py-7"
        >
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#1C1917] text-[#F4F0EA]">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <p className="mb-1 text-sm font-semibold text-[#1C1917]">{title}</p>
            <p className="max-w-[240px] text-sm leading-relaxed text-[#6B635C]">
              {desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OurPolicy;
