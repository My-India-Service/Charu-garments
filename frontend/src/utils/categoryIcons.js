import {
  Baby,
  Bed,
  Briefcase,
  Crown,
  Flower2,
  Footprints,
  Gem,
  Gift,
  Glasses,
  Heart,
  Home,
  Lamp,
  Package,
  Palette,
  Scissors,
  Shirt,
  ShoppingBag,
  Snowflake,
  Sofa,
  Sparkles,
  User,
  Users,
  Utensils,
  Watch,
} from "lucide-react";

/** Pick a lucide icon from category / subcategory name. */
export const pickCategoryIcon = (label = "") => {
  const key = String(label).toLowerCase().trim();

  if (/\bjewell?er|ornament|necklace|ring|bracelet|diamond|gem/.test(key)) return Gem;
  if (/\bfootwear|shoe|sandal|sneaker|boot|slipper|heel|foot/.test(key)) return Footprints;
  if (/\bbag|luggage|leather|backpack|handbag|purse|wallet/.test(key)) return Package;
  if (/\bwatch|clock|timepiece/.test(key)) return Watch;
  if (/\bglass|sunglass|eyewear/.test(key)) return Glasses;
  if (/\bbeauty|cosmetic|makeup|skincare|personal\s*care/.test(key)) return Heart;
  if (/\bgift|craft|festive|decor/.test(key)) return Gift;
  if (/\btextile|fabric|yarn|cloth(?!ing)/.test(key)) return Scissors;
  if (/\bfurniture|sofa|chair|table/.test(key)) return Sofa;
  if (/\bhome|kitchen|garden|furnish/.test(key)) return Home;
  if (/\bbed|linen|quilt|blanket|pillow/.test(key)) return Bed;
  if (/\blamp|light/.test(key)) return Lamp;
  if (/\bfood|kitchenware|utensil|cook/.test(key)) return Utensils;
  if (/\bflower|plant/.test(key)) return Flower2;
  if (/\bart|paint|palette/.test(key)) return Palette;
  if (/\bcrown|premium|luxury/.test(key)) return Crown;
  if (/\baccessori/.test(key)) return Sparkles;
  if (/\bwinter|jacket|wool|coat|sweater/.test(key)) return Snowflake;
  if (/\bbottom|pant|trouser|jeans|skirt|short/.test(key)) return ShoppingBag;
  if (/\btopwear|top\b|shirt|t-?shirt|apparel|clothing|dress|kurti|saree|suit/.test(key))
    return Shirt;
  if (/\bkids?|baby|child|infant|boy|girl/.test(key)) return Baby;
  if (/\bwomen|ladies|female|woman/.test(key)) return Users;
  if (/\bmen\b|gents|male|man\b/.test(key)) return User;
  if (/\bbriefcase|office|formal/.test(key)) return Briefcase;

  return Shirt;
};
