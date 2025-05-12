import { Category } from "@shared/schema";

interface CategoryCardProps {
  category: Category;
  onClick: () => void;
}

export default function CategoryCard({ category, onClick }: CategoryCardProps) {
  return (
    <div 
      className="rounded-[12px] overflow-hidden relative h-40 group cursor-pointer"
      onClick={onClick}
    >
      <img 
        src={category.imageUrl} 
        alt={category.name} 
        className="w-full h-full object-cover transition duration-300 group-hover:scale-110" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h4 className="text-white font-poppins font-medium">{category.name}</h4>
        <p className="text-white text-sm font-lato">
          {category.plantCount} plant{category.plantCount !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
