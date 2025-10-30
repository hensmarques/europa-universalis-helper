import { Kingdom, NameIndex, Province, TradeNode } from "../types";
import { PropsWithChildren, useEffect, useRef, useState } from "react";

import { kingdoms as kingdomsObject } from "../kingdoms";
import mapImage from "../map.png";
import { nodes as nodesObject } from "../nodes";
import { provinces as provincesObject } from "../provinces";

type MapViewportProps = PropsWithChildren<{
    result: NameIndex[] | null;
    infoPanelOpen: boolean;
}>;

const MapViewport = ({ result, infoPanelOpen, children }: MapViewportProps) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapImageRef = useRef<HTMLImageElement>(null);
    const [mapTransform, setMapTransform] = useState<{ x: number; y: number; scale: number }>({ x: 0, y: 0, scale: 1 });
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const dragOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const pinchActiveRef = useRef(false);
    const pinchStartDistanceRef = useRef(0);
    const pinchStartScaleRef = useRef(1);
    const pinchCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const pinchOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    useEffect(() => {
        if (!result || result.length === 0) {
            setMapTransform({ x: 0, y: 0, scale: 1 });
            return;
        }
        const container = mapContainerRef.current;
        const img = mapImageRef.current;
        if (!container || !img) return;

        const focus = () => {
            const first = result[0];
            let topPct: number | null = null;
            let leftPct: number | null = null;
            if (first.type === "province") {
                const p = provincesObject.find((x: Province) => x.name === first.name);
                if (p) { topPct = Number(p.top); leftPct = Number(p.left); }
            } else if (first.type === "node") {
                const n = nodesObject.find((x: TradeNode) => x.name === first.name);
                if (n) { topPct = Number(n.top); leftPct = Number(n.left); }
            } else if (first.type === "kingdom") {
                const k = kingdomsObject.find((x: Kingdom) => x.name === first.name);
                if (k) {
                    const provinces = provincesObject.filter((p: Province) => p.kingdomCaptial === k.capital);
                    if (provinces.length) {
                        const avgTop = provinces.reduce((s, p) => s + Number(p.top), 0) / provinces.length;
                        const avgLeft = provinces.reduce((s, p) => s + Number(p.left), 0) / provinces.length;
                        topPct = avgTop; leftPct = avgLeft;
                    }
                }
            } else if (first.type === "area") {
                const provinces = provincesObject.filter((p: Province) => p.area === first.name);
                if (provinces.length) {
                    const avgTop = provinces.reduce((s, p) => s + Number(p.top), 0) / provinces.length;
                    const avgLeft = provinces.reduce((s, p) => s + Number(p.left), 0) / provinces.length;
                    topPct = avgTop; leftPct = avgLeft;
                }
            }
            if (topPct == null || leftPct == null) return;

            const cw = container.clientWidth;
            const ch = container.clientHeight;
            const iw = img.clientWidth;
            const ih = img.clientHeight;
            if (!iw || !ih) return;

            const targetX = (leftPct / 100) * iw;
            const targetY = (topPct / 100) * ih;

            const scale = Math.min(2.2, Math.max(1.3, Math.min(cw / 320, ch / 220)));
            const x = cw / 2 - targetX * scale;
            const y = ch / 2 - targetY * scale;
            setMapTransform({ x, y, scale });
        };

        if (img.complete) {
            focus();
        } else {
            const onLoad = () => focus();
            img.addEventListener('load', onLoad, { once: true });
            return () => img.removeEventListener('load', onLoad);
        }
    }, [result]);

    return (
        <div
            ref={mapContainerRef}
            style={{ position: "relative", margin: `60px 0 ${infoPanelOpen ? '68px' : '0'} 0`, width: "100%", maxHeight: "calc(100vh - 60px)", maxWidth: "100vw", overflow: "hidden", touchAction: "none" }}
            onMouseLeave={() => { isDraggingRef.current = false; }}
            onMouseUp={() => { isDraggingRef.current = false; }}
            onTouchEnd={() => { isDraggingRef.current = false; pinchActiveRef.current = false; }}
            onWheel={(e) => {
                const container = mapContainerRef.current;
                const img = mapImageRef.current;
                if (!container || !img) return;
                e.preventDefault();
                const rect = container.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                const delta = e.deltaY;
                const sensitivity = 0.0008;
                const normalizedDelta = delta * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 800 : 1);
                const zoom = Math.exp(-normalizedDelta * sensitivity);
                const newScale = Math.max(1, Math.min(4, mapTransform.scale * zoom));
                if (newScale === mapTransform.scale) return;
                const worldX = (mouseX - mapTransform.x) / mapTransform.scale;
                const worldY = (mouseY - mapTransform.y) / mapTransform.scale;
                let newX = mouseX - worldX * newScale;
                let newY = mouseY - worldY * newScale;
                const cw = container.clientWidth;
                const ch = container.clientHeight;
                const iw = img.clientWidth * newScale;
                const ih = img.clientHeight * newScale;
                const minX = Math.min(0, cw - iw);
                const minY = Math.min(0, ch - ih);
                newX = Math.max(minX, Math.min(0, newX));
                newY = Math.max(minY, Math.min(0, newY));
                setMapTransform({ x: newX, y: newY, scale: newScale });
            }}
        >
            <div
                style={{ position: "relative", width: "100%", transform: `translate(${mapTransform.x}px, ${mapTransform.y}px) scale(${mapTransform.scale})`, transformOrigin: "0 0", cursor: mapTransform.scale > 1 ? (isDraggingRef.current ? "grabbing" : "grab") : "default" }}
                onMouseDown={(e) => {
                    if (mapTransform.scale <= 1) return;
                    isDraggingRef.current = true;
                    dragStartRef.current = { x: e.clientX, y: e.clientY };
                    dragOriginRef.current = { x: mapTransform.x, y: mapTransform.y };
                }}
                onMouseMove={(e) => {
                    if (!isDraggingRef.current || mapTransform.scale <= 1) return;
                    const container = mapContainerRef.current;
                    const img = mapImageRef.current;
                    if (!container || !img) return;
                    const dx = e.clientX - dragStartRef.current.x;
                    const dy = e.clientY - dragStartRef.current.y;
                    const tentativeX = dragOriginRef.current.x + dx;
                    const tentativeY = dragOriginRef.current.y + dy;
                    const cw = container.clientWidth;
                    const ch = container.clientHeight;
                    const iw = img.clientWidth * mapTransform.scale;
                    const ih = img.clientHeight * mapTransform.scale;
                    const minX = Math.min(0, cw - iw);
                    const minY = Math.min(0, ch - ih);
                    const clampedX = Math.max(minX, Math.min(0, tentativeX));
                    const clampedY = Math.max(minY, Math.min(0, tentativeY));
                    setMapTransform((prev) => ({ ...prev, x: clampedX, y: clampedY }));
                }}
                onTouchStart={(e) => {
                    const container = mapContainerRef.current;
                    if (!container) return;
                    if (e.touches.length === 2) {
                        pinchActiveRef.current = true;
                        isDraggingRef.current = false;
                        const [t1, t2] = [e.touches[0], e.touches[1]];
                        const rect = container.getBoundingClientRect();
                        const cx = ((t1.clientX + t2.clientX) / 2) - rect.left;
                        const cy = ((t1.clientY + t2.clientY) / 2) - rect.top;
                        pinchCenterRef.current = { x: cx, y: cy };
                        const dx = t2.clientX - t1.clientX;
                        const dy = t2.clientY - t1.clientY;
                        pinchStartDistanceRef.current = Math.hypot(dx, dy);
                        pinchStartScaleRef.current = mapTransform.scale;
                        pinchOriginRef.current = { x: mapTransform.x, y: mapTransform.y };
                    } else if (e.touches.length === 1 && mapTransform.scale > 1) {
                        const t = e.touches[0];
                        isDraggingRef.current = true;
                        dragStartRef.current = { x: t.clientX, y: t.clientY };
                        dragOriginRef.current = { x: mapTransform.x, y: mapTransform.y };
                    }
                }}
                onTouchMove={(e) => {
                    const container = mapContainerRef.current;
                    const img = mapImageRef.current;
                    if (!container || !img) return;
                    if (pinchActiveRef.current && e.touches.length === 2) {
                        e.preventDefault();
                        const [t1, t2] = [e.touches[0], e.touches[1]];
                        const dx = t2.clientX - t1.clientX;
                        const dy = t2.clientY - t1.clientY;
                        const dist = Math.hypot(dx, dy);
                        let newScale = (dist / pinchStartDistanceRef.current) * pinchStartScaleRef.current;
                        newScale = Math.max(1, Math.min(4, newScale));
                        const rect = container.getBoundingClientRect();
                        const cx = ((t1.clientX + t2.clientX) / 2) - rect.left;
                        const cy = ((t1.clientY + t2.clientY) / 2) - rect.top;
                        const centerX = cx;
                        const centerY = cy;
                        const worldX = (centerX - pinchOriginRef.current.x) / pinchStartScaleRef.current;
                        const worldY = (centerY - pinchOriginRef.current.y) / pinchStartScaleRef.current;
                        let newX = centerX - worldX * newScale;
                        let newY = centerY - worldY * newScale;
                        const cw = container.clientWidth;
                        const ch = container.clientHeight;
                        const iw = img.clientWidth * newScale;
                        const ih = img.clientHeight * newScale;
                        const minX = Math.min(0, cw - iw);
                        const minY = Math.min(0, ch - ih);
                        newX = Math.max(minX, Math.min(0, newX));
                        newY = Math.max(minY, Math.min(0, newY));
                        setMapTransform({ x: newX, y: newY, scale: newScale });
                    } else if (isDraggingRef.current && mapTransform.scale > 1 && e.touches.length === 1) {
                        e.preventDefault();
                        const t = e.touches[0];
                        const dx = t.clientX - dragStartRef.current.x;
                        const dy = t.clientY - dragStartRef.current.y;
                        const tentativeX = dragOriginRef.current.x + dx;
                        const tentativeY = dragOriginRef.current.y + dy;
                        const cw = container.clientWidth;
                        const ch = container.clientHeight;
                        const iw = img.clientWidth * mapTransform.scale;
                        const ih = img.clientHeight * mapTransform.scale;
                        const minX = Math.min(0, cw - iw);
                        const minY = Math.min(0, ch - ih);
                        const clampedX = Math.max(minX, Math.min(0, tentativeX));
                        const clampedY = Math.max(minY, Math.min(0, tentativeY));
                        setMapTransform((prev) => ({ ...prev, x: clampedX, y: clampedY }));
                    }
                }}
            >
                {children}
                <img ref={mapImageRef} src={mapImage} alt="map" width={"100%"} />
            </div>
        </div>
    );
};

export default MapViewport;


