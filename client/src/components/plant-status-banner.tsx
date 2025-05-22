import { ReactNode } from "react";
import { PlantStatus } from "@/types";

interface PlantStatusBannerProps {
  status: PlantStatus | string;
  statusText: string;
  icon: ReactNode;
}

export default function PlantStatusBanner({
  status,
  statusText,
  icon,
}: PlantStatusBannerProps) {
  const getBannerColor = () => {
    switch (status) {
      case "needs-water":
        return "bg-[#FF9F43]"; // warning orange
      case "upcoming":
        return "bg-blue-400"; // upcoming blue
      case "unknown":
        return "bg-gray-400"; // neutral gray
      case "healthy":
      default:
        return "bg-[#2ECC71]"; // primary green
    }
  };

  return (
    <div
      className={`absolute top-0 left-0 right-0 ${getBannerColor()} text-white py-1 px-4 font-poppins text-sm flex items-center`}
    >
      {icon}
      {statusText}
    </div>
  );
}
