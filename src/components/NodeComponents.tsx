import React from "react";
import { TradeNode } from "../types";
import { nodes as nodesObject } from "../nodes";
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

export const NodeResult = ({ node }: { node: string }) => {
    const { setSearch } = useSearch();
    const result = nodesObject.find((n: TradeNode) => n.name === node);

    const getSize = () => {
        if (result?.maritime) {
            return '50px';
        }
        return '40px';
    };

    return result && (
        <div key={result.name}
            onClick={() => {
                if (result) {
                    setSearch(`!t.${result.name}`);
                }
            }}
            style={{
                position: "absolute",
                top: String(result.top) + "%", left: String(result.left) + "%",
                border: ".35vw solid " + typeColor('city'), borderRadius: "50%",
                width: getSize(),
                aspectRatio: '1/1',
                boxShadow: '0 0 0 .35vw ' + typeColor('node'),
            }}></div>
    );
};

export const NodeInformation = ({ object }: { object: string }) => {
    const result = nodesObject.find((n: TradeNode) => n.name === object);
    return (
        <div style={{ display: "flex", gap: 8, justifyContent: "space-around", alignItems: "center" }}>
            <p>
                <strong>Node:</strong> {result?.name}
            </p>
            <p>
                <strong>Type:</strong> {result?.maritime ? 'Maritime' : 'Inland'}
            </p>
        </div>
    );
};


