import React from "react";
import Hero from "../components/Hero";
import OfferBanners from "../components/OfferBanners";
import { CategoryBanners, PromoSlider } from "../components/HomeBanners";
import LatestCollection from "../components/LatestCollection";
import BestSeller from "../components/BestSeller";
import OurPolicy from "../components/OurPolicy";
import NewsletterBox from "../components/NewsletterBox";
import Footer from "../components/Footer";

const Home = () => {
  return (
    <div>
      <PromoSlider />
      <OfferBanners />
      <Hero />
      <CategoryBanners />
      <LatestCollection />
      <BestSeller />
      <OurPolicy />
      <NewsletterBox />

    </div>
  );
};

export default Home;
