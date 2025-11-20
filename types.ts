
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Attraction {
  name: string;
  description: string;
  coordinates: Coordinates;
  address: string;
}

export interface GoogleMapsPlaceInfo {
  uri: string;
  title: string;
}

export interface GoogleMapsGroundingChunk {
  maps: GoogleMapsPlaceInfo;
}

export interface GetAttractionsResponse {
  text: string;
  groundingChunks: GoogleMapsGroundingChunk[];
}

export interface Review {
  text: string;
}

export interface AttractionDetailContent {
  description: string;
  traffic: string;
  reviews: Review[];
}

export type CategoryOption = 'all' | 'nature' | 'culture' | 'food' | 'shopping' | 'entertainment';
export type DistanceOption = '1km' | '5km' | '10km';
