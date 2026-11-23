import CategoryGrid from "../components/CategoryGrid";

const Categories = () => {
  return (
    <div className="pt-6 pb-16 sm:pt-8 sm:pb-20">
      <CategoryGrid
        showViewAll={false}
        title="All categories"
        subtitle="Browse every category and type we stock — tap a circle to shop"
      />
    </div>
  );
};

export default Categories;
