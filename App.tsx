
import React, { useState, useCallback } from 'react';
import { getAttractions, getAttractionDetails } from './services/geminiService';
import { Attraction, Coordinates, GoogleMapsGroundingChunk, AttractionDetailContent, CategoryOption, DistanceOption } from './types';
import AttractionCard from './components/AttractionCard';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorAlert from './components/ErrorAlert';
import AttractionModal from './components/AttractionModal';

const App: React.FC = () => {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [selectedCategory, setSelectedCategory] = useState<CategoryOption>('all');
  const [selectedDistance, setSelectedDistance] = useState<DistanceOption>('5km');

  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [attractionDetailContent, setAttractionDetailContent] = useState<AttractionDetailContent | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [groundingLinks, setGroundingLinks] = useState<GoogleMapsGroundingChunk[]>([]);

  const parseAttractions = (text: string): Attraction[] => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const regex = /^\d+\.\s*(.*?)\s*-\s*(.*?)\s*\(地址:\s*(.*?),\s*緯度:\s*(-?\d+\.?\d*),\s*經度:\s*(-?\d+\.?\d*)\)/;
    
    return lines.map(line => {
      const match = line.match(regex);
      if (match) {
        const [, name, description, address, lat, lon] = match;
        return {
          name: name.trim(),
          description: description.trim(),
          address: address.trim(),
          coordinates: {
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
          },
        };
      }
      return null;
    }).filter((attraction): attraction is Attraction => attraction !== null);
  };

  const handleFetchAttractions = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setAttractions([]);
    setGroundingLinks([]);
    setLoadingMessage('正在取得您的位置資訊...');

    if (!navigator.geolocation) {
      setError('您的瀏覽器不支援地理位置功能。');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coordinates: Coordinates = { latitude, longitude };
        
        setLoadingMessage(`AI 正在為您尋找 ${selectedDistance} 內的景點...`);

        try {
          const { text: attractionsText, groundingChunks } = await getAttractions(coordinates, selectedCategory, selectedDistance);
          console.log("Raw AI attractions response:", attractionsText);
          console.log("Grounding Chunks:", groundingChunks);

          const parsed = parseAttractions(attractionsText);
          if(parsed.length === 0) {
            setError("AI 回應的格式不正確，無法解析景點。請檢查瀏覽器控制台的原始 AI 回應。");
          } else {
            setAttractions(parsed);
            setGroundingLinks(groundingChunks);
          }
        } catch (err: any) {
          setError(err.message || '發生未知錯誤。');
        } finally {
          setIsLoading(false);
        }
      },
      (geoError) => {
        let errorMessage = '無法取得您的位置。';
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            errorMessage = '您已拒絕位置資訊存取權限。請在瀏覽器設定中啟用它。';
            break;
          case geoError.POSITION_UNAVAILABLE:
            errorMessage = '目前無法取得位置資訊。';
            break;
          case geoError.TIMEOUT:
            errorMessage = '取得位置資訊超時。';
            break;
        }
        setError(errorMessage);
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [selectedCategory, selectedDistance]);

  const handleCardClick = useCallback(async (attraction: Attraction) => {
    setSelectedAttraction(attraction);
    setIsDetailLoading(true);
    setDetailError(null);
    setAttractionDetailContent(null);
    try {
      const detailContent = await getAttractionDetails(attraction.name);
      setAttractionDetailContent(detailContent);
    } catch (err: any) {
      setDetailError(err.message || '無法取得景點詳細資訊。');
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedAttraction(null);
    setAttractionDetailContent(null);
  }, []);
  
  const CategoryButton: React.FC<{ id: CategoryOption; icon: string; label: string }> = ({ id, icon, label }) => (
    <button
      onClick={() => setSelectedCategory(id)}
      className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 ${
        selectedCategory === id 
          ? 'bg-pink-500 text-white shadow-lg scale-105 ring-2 ring-pink-300' 
          : 'bg-white/60 hover:bg-white text-gray-600 hover:text-pink-500 shadow-sm'
      }`}
    >
      <i className={`fas ${icon} text-2xl mb-1`}></i>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );

  const DistanceButton: React.FC<{ id: DistanceOption; icon: string; label: string }> = ({ id, icon, label }) => (
    <button
      onClick={() => setSelectedDistance(id)}
      className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
        selectedDistance === id 
          ? 'bg-purple-600 text-white shadow-md' 
          : 'bg-white/60 hover:bg-white text-purple-700 shadow-sm'
      }`}
    >
      <i className={`fas ${icon}`}></i>
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-300 via-purple-300 to-blue-300 text-gray-800 font-sans">
      <div className="container mx-auto p-4 md:p-8 relative pb-32">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white shadow-md drop-shadow-lg">
            <i className="fas fa-robot mr-3"></i>AI 景點推薦
          </h1>
          <p className="text-pink-100 mt-2 text-lg font-medium">您的智慧旅遊夥伴</p>
        </header>

        {/* Filters Section */}
        <div className="max-w-4xl mx-auto mb-8 bg-white/30 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-white/50">
          
          <div className="mb-6">
            <h3 className="text-white font-bold mb-3 flex items-center opacity-90">
              <i className="fas fa-tags mr-2"></i> 選擇景點類型
            </h3>
            {/* Category Selection */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              <CategoryButton id="all" icon="fa-globe" label="全部" />
              <CategoryButton id="nature" icon="fa-tree" label="自然" />
              <CategoryButton id="culture" icon="fa-landmark" label="人文" />
              <CategoryButton id="food" icon="fa-utensils" label="美食" />
              <CategoryButton id="shopping" icon="fa-shopping-bag" label="購物" />
              <CategoryButton id="entertainment" icon="fa-ticket-alt" label="娛樂" />
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold mb-3 flex items-center opacity-90">
              <i className="fas fa-ruler-horizontal mr-2"></i> 選擇距離範圍
            </h3>
            {/* Distance Selection */}
            <div className="flex flex-wrap gap-3">
              <DistanceButton id="1km" icon="fa-walking" label="1公里 (步行)" />
              <DistanceButton id="5km" icon="fa-bicycle" label="5公里 (短途)" />
              <DistanceButton id="10km" icon="fa-car" label="10公里 (開車)" />
            </div>
          </div>
        </div>

        <main>
          {isLoading ? (
            <LoadingSpinner message={loadingMessage} />
          ) : error ? (
            <div className="max-w-2xl mx-auto">
              <ErrorAlert message={error} />
              <div className="text-center mt-8">
                <button
                  onClick={handleFetchAttractions}
                  className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-200"
                >
                  <i className="fas fa-redo mr-2"></i>重新尋找景點
                </button>
              </div>
            </div>
          ) : attractions.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {attractions.map((attraction, index) => (
                  <AttractionCard
                    key={index}
                    attraction={attraction}
                    index={index}
                    onClick={handleCardClick}
                  />
                ))}
              </div>
              {groundingLinks.length > 0 && (
                <div className="mt-8 p-4 bg-white/70 backdrop-blur-md rounded-2xl shadow-md">
                  <h3 className="text-lg font-bold text-gray-700 mb-2">參考來源:</h3>
                  <ul className="list-disc list-inside text-gray-600">
                    {groundingLinks.map((chunk, index) => (
                      <li key={index} className="mb-1">
                        <a 
                          href={chunk.maps.uri} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-pink-600 hover:text-pink-800 hover:underline transition-colors"
                        >
                          {chunk.maps.title || chunk.maps.uri}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="text-center p-8 bg-white/60 backdrop-blur-sm rounded-3xl shadow-lg max-w-2xl mx-auto">
              <i className="fas fa-map-marked-alt text-6xl text-pink-500 mb-4"></i>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-700 mb-2">探索您身邊的精彩</h2>
              <p className="text-gray-600 mb-6">
                選擇您感興趣的類型與距離，點擊下方按鈕開始探索！
              </p>
            </div>
          )}
        </main>

        {!isLoading && !error && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-purple-900/20 to-transparent z-40 flex justify-center pointer-events-none">
            <div className="pointer-events-auto">
              <button
                onClick={handleFetchAttractions}
                className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold py-4 px-10 rounded-full shadow-2xl transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-pink-300 border-2 border-white/20 animate-bounce-slight"
              >
                <i className="fas fa-search-location mr-2"></i>
                {attractions.length > 0 ? '重新尋找' : '開始尋找'}
              </button>
            </div>
          </div>
        )}

        <AttractionModal
          attraction={selectedAttraction}
          attractionDetailContent={attractionDetailContent}
          isLoading={isDetailLoading}
          error={detailError}
          onClose={handleCloseModal}
        />
        
        <style>{`
          @keyframes bounce-slight {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          .animate-bounce-slight:hover {
            animation: bounce-slight 1s infinite;
          }
        `}</style>
      </div>
    </div>
  );
};

export default App;
