import { Kingdom, Province } from "../types";

import React from "react";
import { kingdoms as kingdomsObject } from "../kingdoms";
import { provinces as provincesObject } from "../provinces";
import { useSearch } from "../SearchContext";

const typeColor = (type: string): string => {
    switch (type) {
        case "city":
            return "yellow";
        case "node":
            return "green";
        case "territory":
            return "blue";
        default:
            return "red";
    }
};

const getSizePercentage = (size?: string): string => {
    if (size === "small") {
        return "1.51vw";
    }
    return "2.315vw";
};

export const ProvinceResult = ({ province }: { province: string }) => {
    const { setSearch } = useSearch();
    const result = provincesObject.find((p: Province) => p.name === province);
    return (
        result && (
            <div
                key={result.name}
                style={{
                    position: "absolute",
                    top: String(result.top) + "%",
                    left: String(result.left) + "%",
                    border: ".35vw solid " + typeColor(result.type),
                    borderRadius: "50%",
                    width: getSizePercentage(result.size),
                    height: getSizePercentage(result.size),
                    boxShadow: "0 0 12px 5px  #fff30055",
                    cursor: "pointer",
                }}
                onClick={() => {
                    if (result) {
                        setSearch(`!p.${result.name}`);
                    }
                }}
            ></div>
        )
    );
};

export const ProvinceInformation = ({ object }: { object: string }) => {
    const result = provincesObject.find((p: Province) => p.name === object);
    let properKingdomName: string | undefined = undefined;
    if (result?.kingdomCaptial) {
        const kingdom = kingdomsObject.find(k => k.capital === result.kingdomCaptial);
        if (kingdom) {
            properKingdomName = kingdom.name;
        }
    }
    const { setSearch } = useSearch();

    return (
        <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
            <p>
                <strong style={{ textTransform: "capitalize" }}>{result?.type}:</strong> {result?.name}
            </p>
            {result?.type !== "territory" && (
                <p>
                    <strong>Kingdom:</strong>{" "}
                    <span
                        style={{ textDecoration: "underline", cursor: "pointer" }}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (properKingdomName) {
                                setSearch(`!k.${properKingdomName}`);
                            }
                        }}
                    >
                        {properKingdomName}
                    </span>
                </p>
            )}
            {result?.type !== "territory" && (
                <p>
                    <strong>Size:</strong>{" "}
                    {result?.size === "small" ? "Small" : "Large"}
                </p>
            )}
            <p>
                <strong>Map:</strong> {result?.map}
            </p>
            <p>
                <strong>Area:</strong>{" "}
                <span
                    style={{ textDecoration: "underline", cursor: "pointer" }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (result?.area) {
                            setSearch(`!a.${result.area}`);
                        }
                    }}
                >
                    {result?.area}
                </span>
            </p>
            <p>
                <strong>Port:</strong> {result?.port ? "Yes" : "No"}
            </p>
        </div>
    );
};


