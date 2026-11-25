import React from "react";
import OfferBanners from "../components/OfferBanners";
import { CategoryBanners, PromoSlider } from "../components/HomeBanners";
import CategoryGrid from "../components/CategoryGrid";
import NewArrival from "../components/NewArrival";
import BestSeller from "../components/BestSeller";
import OurPolicy from "../components/OurPolicy";
import NewsletterBox from "../components/NewsletterBox";

const Home = () => {
  return (
    <div>
      <PromoSlider />
      <OfferBanners />
      <CategoryGrid limit={12} />
      <CategoryBanners />
      <NewArrival />
      <BestSeller />
      <OurPolicy />
      <NewsletterBox />
    </div>
  );
};

export default Home;
