import "./App.css";

import { AreaInformation, AreaResult } from "./components/AreaComponents";
import { KingdomInformation, KingdomResult } from "./components/KingdomComponents";
import { NodeInformation, NodeResult } from "./components/NodeComponents";
import { ProvinceInformation, ProvinceResult } from "./components/ProvinceComponents";
import { useEffect, useMemo, useRef, useState } from "react";

import AppBar from "@mui/material/AppBar";
import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import ClearIcon from "@mui/icons-material/Clear";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import IconButton from "@mui/material/IconButton";
import MapViewport from "./components/MapViewport";
import { NameIndex } from "./types";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { areas as areasObject } from "./areas";
import { kingdoms as kingdomsObject } from "./kingdoms";
import { nodes as nodesObject } from "./nodes";
import { provinces as provincesObject } from "./provinces";
import { useSearch } from "./SearchContext";

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
    }, [setSearch]);

    return (
        <div className="App">
            <AppBar position="fixed" color="default" elevation={0}>
                <Toolbar style={{ gap: 8 }}>
                    <Tooltip title="Clear">
                        <span>
                            <IconButton
                                aria-label="clear"
                                size="small"
                                onClick={() => {
                                    setSearch("");
                                    setObjectInformation(null);
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
            <MapViewport result={result} infoPanelOpen={!!objectInformation}>
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
            </MapViewport>
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
