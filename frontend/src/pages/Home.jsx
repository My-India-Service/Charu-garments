import React from "react";
import Hero from "../components/Hero";
import OfferBanners from "../components/OfferBanners";
import LatestCollection from "../components/LatestCollection";
import BestSeller from "../components/BestSeller";
import OurPolicy from "../components/OurPolicy";
import NewsletterBox from "../components/NewsletterBox";
import Footer from "../components/Footer";

const Home = () => {
  return (
    <div>
      <OfferBanners />
      <Hero />
      <LatestCollection />
      <BestSeller />
      <OurPolicy />
      <NewsletterBox />

    </div>
  );
};

export default Home;
