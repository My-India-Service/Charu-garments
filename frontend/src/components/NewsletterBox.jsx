import React from "react";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

const NewsletterBox = () => {
  const onSubmitHandler = (event) => {
    event.preventDefault();

    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.7 },
    });

    toast.success("You're in! Welcome to Charu Garments.", {
      duration: 4500,
    });

    event.target.reset();
  };

  return (
    <div className="mb-4 rounded-3xl border border-[#E6DFD6] bg-[#FBF9F6] px-6 py-12 text-center sm:px-10 sm:py-16">
      <p className="text-xs uppercase tracking-[0.32em] text-[#8A8178]">
        Newsletter
      </p>

      <p className="prata-regular mt-3 text-3xl leading-snug text-[#1C1917] sm:text-4xl">
        Join the Charu Garments Community
      </p>

      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[#6B635C]">
        Stay updated with the latest fashion trends, exclusive offers, and new
        arrivals from Charu Garments.
      </p>

      <form
        onSubmit={onSubmitHandler}
        className="mx-auto mt-7 flex w-full items-stretch overflow-hidden rounded-full border border-[#E6DFD6] bg-white transition-colors duration-200 focus-within:border-[#7A3030] sm:w-[480px]"
      >
        <input
          className="min-w-0 flex-1 bg-transparent px-5 py-3.5 text-sm outline-none placeholder:text-[#8A8178]"
          type="email"
          placeholder="Enter your email address"
          required
        />
        <button
          type="submit"
          className="flex-shrink-0 bg-[#1C1917] px-7 py-3.5 text-xs tracking-widest text-[#F4F0EA] transition-all duration-150 hover:bg-[#7A3030] active:scale-[0.98]"
        >
          SUBSCRIBE
        </button>
      </form>
    </div>
  );
};

export default NewsletterBox;
