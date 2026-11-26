export const CATEGORIES = ['SPORT', 'LEISURE'] as const;
export const SUBCATEGORIES = ['BASKETBALL', 'RUNNING', 'ARCADE', 'TCG_BOARDGAMES'] as const;
export const MODALITIES = ['CASUAL', 'ORGANIZED'] as const;
export const ACTIVITY_STATUSES = ['OPEN', 'FULL', 'COMPLETED', 'CANCELLED'] as const;

export type Category = string;
export type Subcategory = string;
export type Modality = (typeof MODALITIES)[number];
export type ActivityModality = Modality;
export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];

export interface ActivityLocation {
  type: 'Point';
  // GeoJSON ordering: [longitude, latitude].
  coordinates: [number, number];
  addressName: string;
  isStoreLocation: boolean;
}

export type GeoLocation = ActivityLocation;

export interface ActivityRoute {
  distanceKm: number;
  paceTarget?: string;
  path: {
    type: 'LineString';
    // GeoJSON ordering: [longitude, latitude].
    coordinates: [number, number][];
  };
}

export interface ActivitySchedule {
  startTime: string;
  endTime: string;
}

export interface ActivityCapacity {
  minParticipants: number;
  maxParticipants: number;
}

export interface ActivityPricing {
  price: number;
  prizeInfo?: string;
}

export interface ActivityParticipant {
  userId: string;
  name: string;
  avatarUrl?: string;
  joinedAt: string;
}

export interface Activity {
  _id: string;
  creatorId: string | { _id: string; name: string; email?: string };
  title: string;
  description: string;
  category: Category;
  subcategory: Subcategory;
  modality: Modality;
  status: ActivityStatus;
  location: ActivityLocation;
  route?: ActivityRoute;
  schedule: ActivitySchedule;
  capacity: ActivityCapacity;
  pricing: ActivityPricing;
  participants: ActivityParticipant[];
  deleted?: boolean;
  deletedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ActivityInput = Omit<
  Activity,
  '_id' | 'creatorId' | 'participants' | 'deleted' | 'deletedAt' | 'createdAt' | 'updatedAt' | 'location' | 'capacity' | 'pricing' | 'modality' | 'status'
> & {
  modality?: Modality;
  status?: ActivityStatus;
  location: Omit<ActivityLocation, 'coordinates' | 'type' | 'isStoreLocation'> & {
    type?: 'Point';
    coordinates?: [number, number];
    isStoreLocation?: boolean;
  };
  capacity: { maxParticipants: number; minParticipants?: number };
  pricing?: ActivityPricing;
};
