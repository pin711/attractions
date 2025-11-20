
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Coordinates, GetAttractionsResponse, GoogleMapsGroundingChunk, AttractionDetailContent, CategoryOption, DistanceOption } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

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
  try {
    const categoryText = getCategoryLabel(category);
    const distanceText = getDistanceLabel(distance);

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      // 更新提示以包含類別和距離篩選
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
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("無法從 AI 獲取推薦。請稍後再試。");
  }
};

export const getAttractionDetails = async (attractionName: string): Promise<AttractionDetailContent> => {
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
  } catch (error) {
    console.error("Error calling Gemini API for details or parsing response:", error);
    if (error instanceof SyntaxError) {
        throw new Error(`AI 回應的格式不正確，無法解析 JSON。原始回應: ${error.message}. 原始回應文本: ${rawJsonText || (geminiResponse ? geminiResponse.text : 'N/A')}`);
    }
    throw new Error("無法從 AI 獲取景點詳細資訊。請稍後再試。");
  }
};
