
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Coordinates, GetAttractionsResponse, GoogleMapsGroundingChunk, AttractionDetailContent, CategoryOption, DistanceOption } from '../types';

const API_KEY = process.env.API_KEY;

// 增加更明確的檢查
if (!API_KEY || API_KEY.length < 10) {
  console.error("API Key is missing or invalid length:", API_KEY);
  // 這裡不 throw，允許 UI 顯示更友善的錯誤，但在呼叫時會失敗
}

const ai = new GoogleGenAI({ apiKey: API_KEY || 'DUMMY_KEY' });

const getCategoryLabel = (category: CategoryOption): string => {
  const map: Record<CategoryOption, string> = {
    all: "各種",
    nature: "自然生態與戶外",
    culture: "歷史文化與古蹟",
    food: "必吃美食與餐廳",
    shopping: "購物商圈",
    entertainment: "休閒娛樂與活動"
  };
  return map[category];
};

const getDistanceLabel = (distance: DistanceOption): string => {
  const map: Record<DistanceOption, string> = {
    '1km': "1公里內 (步行可達)",
    '5km': "5公里內 (短途)",
    '10km': "10公里內 (車程範圍)"
  };
  return map[distance];
};

export const getAttractions = async (coords: Coordinates, category: CategoryOption, distance: DistanceOption): Promise<GetAttractionsResponse> => {
  if (!API_KEY) {
    throw new Error("未設定 API Key。請確認 GitHub Secrets 設定或本地 .env 檔案。");
  }

  try {
    const categoryText = getCategoryLabel(category);
    const distanceText = getDistanceLabel(distance);

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `請根據我目前的位置 (緯度:${coords.latitude}, 經度:${coords.longitude})，推薦5個「${distanceText}」且屬於「${categoryText}」類型的熱門旅遊景點。請用繁體中文回答。每個景點需包含：景點名稱、簡短描述、詳細地址以及經緯度。請嚴格遵守以下數字列表格式，不要添加任何額外文字或說明：'1. 景點名稱 - 簡短描述 (地址: 景點詳細地址, 緯度: 25.0330, 經度: 121.5654)'。`,
      config: {
        tools: [{googleMaps: {}}],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: coords.latitude,
              longitude: coords.longitude
            }
          }
        }
      },
    });

    const groundingChunks: GoogleMapsGroundingChunk[] = 
      (response.candidates?.[0]?.groundingMetadata?.groundingChunks as GoogleMapsGroundingChunk[] || [])
      .filter(chunk => chunk.maps && chunk.maps.uri);

    return {
      text: response.text,
      groundingChunks: groundingChunks
    };
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    
    // 解析並回傳具體錯誤訊息
    let errorMessage = error.message || error.toString();
    
    if (errorMessage.includes("API_KEY")) {
      errorMessage = "API Key 無效或未設定。";
    } else if (errorMessage.includes("403")) {
      errorMessage = "存取被拒 (403)。請檢查 API Key 是否正確，或是否有權限使用此模型 (gemini-2.5-flash)。";
    } else if (errorMessage.includes("429")) {
      errorMessage = "請求過多 (429) 或額度已滿。請稍後再試。";
    } else if (errorMessage.includes("not found") || errorMessage.includes("404")) {
      errorMessage = "找不到模型 (404)。該模型可能尚未在您的區域開放，或名稱有誤。";
    }

    throw new Error(`API 錯誤: ${errorMessage}`);
  }
};

export const getAttractionDetails = async (attractionName: string): Promise<AttractionDetailContent> => {
  if (!API_KEY) throw new Error("API Key 未設定");

  let geminiResponse: GenerateContentResponse | undefined;
  let rawJsonText: string | undefined;

  try {
    geminiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `請為我詳細介紹一下「${attractionName}」這個景點。請提供：1. 一段詳細的描述 (description)，包含歷史、特色、推薦的參觀重點。2. 該景點的交通方式 (traffic)。3. 幾條相關的評論 (reviews)。請用繁體中文回答，並以 JSON 格式輸出，嚴格遵循以下 schema，不要包含任何額外的文字或說明：`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: {
                type: Type.STRING,
                description: '景點的詳細描述，包含歷史、特色、推薦參觀重點。',
              },
              traffic: {
                type: Type.STRING,
                description: '前往景點的交通方式。',
              },
              reviews: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: {
                      type: Type.STRING,
                      description: '一條關於景點的評論。',
                    },
                  },
                  required: ['text'],
                },
                description: '關於景點的評論列表。',
              },
            },
            required: ['description', 'traffic', 'reviews'],
            propertyOrdering: ['description', 'traffic', 'reviews'],
          },
        },
    });
    console.log(`Raw AI details response for ${attractionName}:`, geminiResponse.text);
    rawJsonText = geminiResponse.text.trim();
    const parsedDetails: AttractionDetailContent = JSON.parse(rawJsonText);
    return parsedDetails;
  } catch (error: any) {
    console.error("Error calling Gemini API for details:", error);
    throw new Error(`無法獲取詳細資訊: ${error.message}`);
  }
};
