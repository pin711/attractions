
import React from 'react';
import { Attraction } from '../types';

interface AttractionCardProps {
  attraction: Attraction;
  index: number;
  onClick: (attraction: Attraction) => void;
}

const AttractionCard: React.FC<AttractionCardProps> = ({ attraction, index, onClick }) => {
  const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(attraction.name)}/600/400`;
  
  // Google Maps Directions URL
  // 使用精確的經緯度作為導航目的地，這是最可靠的方式
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${attraction.coordinates.latitude},${attraction.coordinates.longitude}`;

  return (
    <div 
      className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col h-full group"
    >
      <div 
        className="relative h-48 overflow-hidden cursor-pointer"
        onClick={() => onClick(attraction)}
      >
        <img 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
          src={imageUrl} 
          alt={`一個關於 ${attraction.name} 的示意圖`} 
        />
        <div className="absolute top-0 left-0 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-br-lg">
          #{index + 1}
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <h3 
          className="text-xl font-bold text-gray-800 mb-2 cursor-pointer hover:text-pink-600 transition-colors"
          onClick={() => onClick(attraction)}
        >
          {attraction.name}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">
          {attraction.description}
        </p>
        
        {attraction.address && (
          <p className="text-gray-400 text-xs mb-4 flex items-start">
            <i className="fas fa-map-marker-alt mr-2 mt-1 text-pink-400"></i>
            <span>{attraction.address}</span>
          </p>
        )}

        <div className="flex gap-2 mt-auto pt-3 border-t border-gray-100">
          <button 
            onClick={() => onClick(attraction)}
            className="flex-1 bg-purple-50 text-purple-600 py-2 rounded-lg text-sm font-semibold hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
          >
            <i className="fas fa-info-circle"></i> 詳細介紹
          </button>
          <a 
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-center no-underline"
            onClick={(e) => e.stopPropagation()}
            title="在 Google 地圖開啟導航"
          >
            <i className="fas fa-location-arrow"></i> 導航
          </a>
        </div>
      </div>
    </div>
  );
};

export default AttractionCard;
