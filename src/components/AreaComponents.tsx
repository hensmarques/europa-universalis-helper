import { Area, Province } from "../types";

import { ProvinceResult } from "./ProvinceComponents";
import React from "react";
import { areas as areasObject } from "../areas";
import { provinces as provincesObject } from "../provinces";

export const AreaResult = ({ area }: { area: string }) => {
    const areaObj = areasObject.find((a: Area) => a.name === area);
    if (!areaObj) return null;
    return (
        <>
            {provincesObject
                .filter((province: Province) => province.area === areaObj.name)
                .map((province: Province) => (
                    <ProvinceResult
                        key={province.name}
                        province={province.name}
                    />
                ))}
        </>
    );
};

export const AreaInformation = ({ object }: { object: string }) => {
    const areaObj = areasObject.find((a: Area) => a.name === object);
    const provincesInArea = provincesObject.filter((p: Province) => p.area === object);
    return (
        <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
            <p>
                <strong>Area:</strong> {areaObj?.name}
            </p>
            <p>
                <strong>Provinces:</strong> {provincesInArea.length}
            </p>
            <div className="provinces">
                {provincesInArea.map((p) => (
                    <span key={p.name} style={{ marginRight: 8 }}>{p.name}</span>
                ))}
            </div>
        </div>
    );
};


