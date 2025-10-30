import { Kingdom, Province } from "../types";

import { ProvinceResult } from "./ProvinceComponents";
import React from "react";
import { kingdoms as kingdomsObject } from "../kingdoms";
import { provinces as provincesObject } from "../provinces";

export const KingdomResult = ({ kingdom }: { kingdom: string }) => {
    const result = kingdomsObject.find((k: Kingdom) => k.name === kingdom);
    return (
        result &&
        provincesObject
            .filter((province: Province) => {
                return result && province.kingdomCaptial === result.capital;
            })
            .map((province: Province) => (
                <ProvinceResult key={province.name} province={province.name} />
            ))
    );
};

export const KingdomInformation = ({ object }: { object: string }) => {
    const result = kingdomsObject.find((k: Kingdom) => k.name === object);
    return (
        <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
            <p>
                <strong>Kingdom:</strong> {result?.name}
            </p>
            <p>
                <strong>Tax Value:</strong> {result?.taxValue} + (Vassals: {result?.vassalsTaxValue})
            </p>
            <p>
                <strong>Capital:</strong> {result?.capital}
            </p>
        </div>
    );
};


