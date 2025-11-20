import React, { useEffect } from 'react';
import { Attraction, AttractionDetailContent } from '../types'; // 導入 AttractionDetailContent
import LoadingSpinner from './LoadingSpinner';
import ErrorAlert from './ErrorAlert';

interface AttractionModalProps {
  attraction: Attraction | null;
  attractionDetailContent: AttractionDetailContent | null; // 改變屬性名稱和型別
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

const AttractionModal: React.FC<AttractionModalProps> = ({ attraction, attractionDetailContent, isLoading, error, onClose }) => { // 改變 props
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!attraction) return null;

  const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(attraction.name)}/600/400`;

  console.log("AttractionModal state: isLoading=", isLoading, "error=", error, "attractionDetailContent=", attractionDetailContent); // DEBUG LOG

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="attraction-modal-title"
    >
      <div 
        className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-transform duration-300 scale-95 animate-modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 id="attraction-modal-title" className="text-xl sm:text-2xl font-bold text-gray-700">{attraction.name}</h2>
            {attraction.address && (
              <p className="mt-1 text-gray-500 text-sm flex items-center">
                <i className="fas fa-map-marker-alt mr-2 text-pink-500"></i>
                <span>{attraction.address}</span>
              </p>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-red-400 p-2 rounded-full hover:bg-red-50 transition-colors"
            aria-label="關閉視窗"
          >
            <i className="fas fa-times text-2xl"></i>
          </button>
        </header>
        
        <div className="overflow-y-auto p-4 sm:p-6 flex flex-col gap-6"> {/* 調整為單欄佈局 */}
          <div className="flex-shrink-0">
            <img 
              src={imageUrl} 
              alt={`關於 ${attraction.name} 的圖片`} 
              className="w-full h-auto rounded-xl shadow-md object-cover" 
            />
          </div>
          <div>
            {isLoading && <LoadingSpinner message="AI 正在產生詳細介紹..." />}
            {error && <ErrorAlert message={error} />}
            
            {!isLoading && !error && !attractionDetailContent && ( // 檢查新的狀態
              <p className="text-gray-500 text-center py-4">AI 未能提供詳細介紹，請稍後再試。</p>
            )}

            {attractionDetailContent && ( // 顯示結構化的詳細內容
              <div className="prose max-w-none text-gray-600 leading-relaxed space-y-6">
                {/* 詳細介紹 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-700 mb-2">詳細介紹</h3>
                  {attractionDetailContent.description.split('\n').filter(p => p.trim() !== '').map((paragraph, index) => (
                    <p key={`desc-${index}`}>{paragraph}</p>
                  ))}
                </div>

                {/* 交通方式 */}
                {attractionDetailContent.traffic && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">交通方式</h3>
                    {attractionDetailContent.traffic.split('\n').filter(p => p.trim() !== '').map((paragraph, index) => (
                      <p key={`traffic-${index}`}>{paragraph}</p>
                    ))}
                  </div>
                )}

                {/* 用戶評論 */}
                {attractionDetailContent.reviews && attractionDetailContent.reviews.length > 0 && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">用戶評論</h3>
                    <div className="space-y-4">
                      {attractionDetailContent.reviews.map((review, index) => (
                        <div key={`review-${index}`} className="bg-pink-50 p-4 rounded-xl shadow-sm">
                          <p className="text-gray-600 italic">"{review.text}"</p>
                          {/* 如果有更多評論屬性（如作者、評分），可以在這裡顯示 */}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
       <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes modal-enter {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-modal-enter {
          animation: modal-enter 0.3s ease-out forwards;
        }
        .prose p {
          margin-bottom: 1.25em;
        }
      `}</style>
    </div>
  );
};

export default AttractionModal;