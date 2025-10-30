export type ProvinceType = "city" | "territory";
export type MapType = "main" | "expansion" | "distant";
export type Size = "small" | "large";
export type Religion = "Catholic" | "Orthodox" | "Muslim" | "Diverse Faiths" | "";

export interface Province {
  name: string;
  type: ProvinceType;
  top: string | number;
  left: string | number;
  size?: Size;
  kingdomCaptial?: string;
  map: MapType;
  area: string;
  port: boolean;
  only?: number;
}

export interface Kingdom {
  name: string;
  capital: string;
  taxValue: number;
  vassalsTaxValue?: number;
  vassals?: string[];
}

export interface Area {
  name: string;
  adjacentSeas: string[];
  adjacentAreas: string[];
  hreMember: boolean;
  religion: string;
  distant: boolean;
}

export interface TradeNode {
  name: string;
  distant: boolean;
  left: number;
  top: number;
  maritime: boolean;
}

export interface NameIndex {
  name: string;
  type: "province" | "kingdom" | "area" | "node";
}

