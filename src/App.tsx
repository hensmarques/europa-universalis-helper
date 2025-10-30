import "./App.css";

import { Area, Kingdom, NameIndex, Province, TradeNode } from "./types";
import { AreaInformation, AreaResult } from "./components/AreaComponents";
import { KingdomInformation, KingdomResult } from "./components/KingdomComponents";
import { NodeInformation, NodeResult } from "./components/NodeComponents";
import { ProvinceInformation, ProvinceResult } from "./components/ProvinceComponents";
import { useEffect, useMemo, useRef, useState } from "react";

import AppBar from "@mui/material/AppBar";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import ClearIcon from "@mui/icons-material/Clear";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import IconButton from "@mui/material/IconButton";
// import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { areas as areasObject } from "./areas";
import { kingdoms as kingdomsObject } from "./kingdoms";
import mapImage from "./map.png";
import { nodes as nodesObject } from "./nodes";
import { provinces as provincesObject } from "./provinces";
import { useSearch } from "./SearchContext";

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

const resultTypeColor = (type: NameIndex["type"]): string => {
    switch (type) {
        case "province":
            return "#e53935"; // red
        case "kingdom":
            return "#fbc02d"; // yellow
        case "area":
            return "#1e88e5"; // blue
        case "node":
            return "#43a047"; // green
        default:
            return "#757575";
    }
};

const useCompiledNameIndexes = (
    provinces: typeof provincesObject,
    kingdoms: typeof kingdomsObject,
    areas: typeof areasObject,
    nodes: typeof nodesObject
) =>
    useMemo(() => {
        const nameIndexes: NameIndex[] = [];
        // Provinces
        for (const province of Object.values(provinces)) {
            nameIndexes.push({
                name: province.name,
                type: "province"
            });
        }
        // Kingdoms
        for (const kingdom of Object.values(kingdoms)) {
            nameIndexes.push({
                name: kingdom.name,
                type: "kingdom"
            });
        }
        // Areas
        for (const area of Object.values(areas)) {
            nameIndexes.push({
                name: area.name,
                type: "area"
            });
        }
        // Nodes
        for (const node of Object.values(nodes)) {
            nameIndexes.push({
                name: node.name,
                type: "node"
            });
        }
        return nameIndexes;
    }, [provinces, kingdoms, areas, nodes]);

function App() {
    const { search, setSearch } = useSearch();
    const [result, setResult] = useState<NameIndex[] | null>(null);
    const [objectInformation, setObjectInformation] = useState<NameIndex | null>(null);
    const [helpOpen, setHelpOpen] = useState<boolean>(false);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapImageRef = useRef<HTMLImageElement>(null);
    const [mapTransform, setMapTransform] = useState<{ x: number; y: number; scale: number }>({ x: 0, y: 0, scale: 1 });
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const dragOriginRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    const nameIndexes = useCompiledNameIndexes(
        provincesObject,
        kingdomsObject,
        areasObject,
        nodesObject
    );

    useEffect(() => {
        if (search) {
            let filteredType: NameIndex["type"] | null = null;
            let keyword = search.trim();

            // Strict search support: if search begins with '!', do exact (case-insensitive) match
            let strict = false;
            if (keyword.startsWith('!')) {
                strict = true;
                keyword = keyword.slice(1).trim();
            }

            // Support "p."/ "P." prefix for province search in search bar
            if (/^[ktap]\./i.test(keyword)) {
                const prefix = keyword[0].toLowerCase();
                keyword = keyword.slice(2); // remove "x." part
                if (prefix === "k") filteredType = "kingdom";
                else if (prefix === "t") filteredType = "node";
                else if (prefix === "p") filteredType = "province";
                else if (prefix === "a") filteredType = "area";
            }

            const cleanSearch = keyword.toLowerCase().replace("&", "");

            const nameIndex = nameIndexes.filter((item: NameIndex) => {
                const matchesType = !filteredType || item.type === filteredType;
                let matchesKeyword: boolean;
                if (strict) {
                    matchesKeyword = item.name.toLowerCase() === cleanSearch;
                } else {
                    matchesKeyword = item.name.toLowerCase().includes(cleanSearch);
                }
                return matchesType && matchesKeyword;
            });
            setResult(nameIndex);
            if (nameIndex.length === 1) {
                setObjectInformation(nameIndex[0]);
            } else {
                setObjectInformation(null);
            }
        } else {
            setResult(null);
        }
    }, [search, nameIndexes]);

    // Zoom and center on the first result without external plugins
    useEffect(() => {
        if (!result || result.length === 0) {
            // Reset zoom when nothing is selected
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

    // duplicate effect removed

    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
                e.preventDefault();
                setSearch("");
                setTimeout(() => {
                    if (searchInputRef.current) {
                        searchInputRef.current.focus();
                    }
                }, 0);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);


    return (
        <div className="App">
            <AppBar position="static" color="default" elevation={0}>
                <Toolbar style={{ gap: 8 }}>
                    <Tooltip title="Clear">
                        <span>
                            <IconButton
                                aria-label="clear"
                                size="small"
                                onClick={() => {
                                    setSearch("");
                                    setTimeout(() => searchInputRef.current?.focus(), 0);
                                }}
                                disabled={!search}
                            >
                                <ClearIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Autocomplete
                        sx={{ flex: 1 }}
                        size="small"
                        freeSolo
                        clearOnBlur={false}
                        selectOnFocus
                        handleHomeEndKeys
                        options={nameIndexes}
                        getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                        filterOptions={(options, state) => {
                            const raw = state.inputValue || "";
                            let keyword = raw.trim();
                            let strict = false;
                            if (keyword.startsWith('!')) {
                                strict = true;
                                keyword = keyword.slice(1).trim();
                            }
                            let filteredType: NameIndex["type"] | null = null;
                            if (/^[ktap]\./i.test(keyword)) {
                                const prefix = keyword[0].toLowerCase();
                                keyword = keyword.slice(2);
                                if (prefix === "k") filteredType = "kingdom";
                                else if (prefix === "t") filteredType = "node";
                                else if (prefix === "p") filteredType = "province";
                                else if (prefix === "a") filteredType = "area";
                            }
                            const clean = keyword.toLowerCase().replace('&', '');
                            return options.filter((opt) => {
                                const typeOk = !filteredType || opt.type === filteredType;
                                if (!clean) return typeOk; // when only prefix is typed, show all of that type
                                const nameLc = opt.name.toLowerCase();
                                const match = strict ? nameLc === clean : nameLc.includes(clean);
                                return typeOk && match;
                            });
                        }}
                        inputValue={search}
                        onInputChange={(_, value) => setSearch(value)}
                        onChange={(_, value) => {
                            if (!value) return;
                            if (typeof value === 'string') {
                                setSearch(value);
                                return;
                            }
                            const prefix = value.type === "province" ? "p"
                                : value.type === "kingdom" ? "k"
                                : value.type === "area" ? "a"
                                : value.type === "node" ? "t"
                                : "";
                            if (prefix) {
                                setSearch(`!${prefix}.${value.name}`);
                            } else {
                                setSearch(`!${value.name}`);
                            }
                        }}
                        renderOption={(props, option) => {
                            if (typeof option === 'string') {
                                return (
                                    <li {...props} key={`free-${option}`}>
                                        <Typography variant="body2">{option}</Typography>
                                    </li>
                                );
                            }
                            return (
                                <li {...props} key={`${option.type}-${option.name}`}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <span style={{
                                            display: "inline-block",
                                            width: 10,
                                            height: 10,
                                            borderRadius: "50%",
                                            background: resultTypeColor(option.type)
                                        }} />
                                        <Typography variant="body2">{option.name}</Typography>
                                        <Chip
                                            label={option.type}
                                            size="small"
                                            sx={{
                                                height: 20,
                                                textTransform: "capitalize",
                                                bgcolor: resultTypeColor(option.type),
                                                color: "#fff"
                                            }}
                                        />
                                    </Stack>
                                </li>
                            );
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                inputRef={searchInputRef}
                                placeholder="Search (Ctrl + P)"
                                InputProps={{ ...params.InputProps, sx: { borderRadius: 2 } }}
                            />
                        )}
                    />
                    <Tooltip title="Search help">
                        <IconButton aria-label="help" size="small" onClick={() => setHelpOpen(true)}>
                            <HelpOutlineIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Toolbar>
            </AppBar>
            <SearchHelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
            <div
                ref={mapContainerRef}
                style={{ position: "relative", margin: "0px 0 48px 0", width: "100%", overflow: "hidden" }}
                onMouseLeave={() => { isDraggingRef.current = false; }}
                onMouseUp={() => { isDraggingRef.current = false; }}
                onTouchEnd={() => { isDraggingRef.current = false; }}
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
                        if (mapTransform.scale <= 1) return;
                        const t = e.touches[0];
                        if (!t) return;
                        isDraggingRef.current = true;
                        dragStartRef.current = { x: t.clientX, y: t.clientY };
                        dragOriginRef.current = { x: mapTransform.x, y: mapTransform.y };
                    }}
                    onTouchMove={(e) => {
                        if (!isDraggingRef.current || mapTransform.scale <= 1) return;
                        const t = e.touches[0];
                        if (!t) return;
                        const container = mapContainerRef.current;
                        const img = mapImageRef.current;
                        if (!container || !img) return;
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
                    }}
                >
                {result?.map((item: NameIndex, index: number) => {
                    if (item.type === "province") {
                        return (
                            <ProvinceResult
                                key={index}
                                province={item.name}
                            />
                        );
                    } else if (item.type === "kingdom") {
                        return (
                            <KingdomResult
                                key={index}
                                kingdom={item.name}
                            />
                        );
                     } else if (item.type === "node") {
                         return (
                             <NodeResult
                                 key={index}
                                 node={item.name}
                             />
                         );
                     } else if (item.type === "area") {
                         return (
                             <AreaResult
                                 key={index}
                                 area={item.name}
                             />
                         );
                    }
                    return null;
                })}
                <img ref={mapImageRef} src={mapImage} alt="map" width={"100%"} />
                </div>
            </div>
            {objectInformation && (
                <Paper
                    elevation={6}
                    style={{
                        position: "fixed",
                        left: 16,
                        right: 16,
                        bottom: 16,
                        maxHeight: "36vh",
                        overflow: "auto",
                        padding: 8,
                        borderRadius: 12,
                        background: "#ffffffee",
                        backdropFilter: "blur(4px)",
                    }}
                >
                    {(() => {
                        if (objectInformation.type === "province") {
                            return (
                                <ProvinceInformation object={objectInformation.name} />
                            );
                        } else if (objectInformation.type === "kingdom") {
                            return (
                                <KingdomInformation object={objectInformation.name} />
                            );
                        } else if (objectInformation.type === "node") {
                            return (
                                <NodeInformation object={objectInformation.name} />
                            );
                        } else if (objectInformation.type === "area") {
                            return (
                                <AreaInformation object={objectInformation.name} />
                            );
                        }
                        return null;
                    })()}
                </Paper>
            )}
        </div>
    );
}

export default App;

const SearchHelpDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Search syntax</DialogTitle>
            <DialogContent dividers>
                <ul>
                    <li>Type to fuzzy-match across provinces, kingdoms, areas, and nodes.</li>
                    <li>Use strict search with a leading <code>!</code>: e.g., <code>!Lisbon</code>.</li>
                    <li>
                        Prefix filters:
                        <ul>
                            <li><code>p.&lt;name&gt;</code>: province (e.g., <code>p.Lisbon</code>)</li>
                            <li><code>k.&lt;name&gt;</code>: kingdom (e.g., <code>k.Portugal</code>)</li>
                            <li><code>a.&lt;name&gt;</code>: area (e.g., <code>a.Alentejo</code>)</li>
                            <li><code>t.&lt;name&gt;</code>: node (e.g., <code>t.Seville</code>)</li>
                        </ul>
                    </li>
                    <li>Combine strict + prefix: <code>!p.Lisbon</code>, <code>!k.Portugal</code>, etc.</li>
                    <li>Clicking map markers updates the search accordingly.</li>
                </ul>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} autoFocus>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

// components moved to src/components/*
