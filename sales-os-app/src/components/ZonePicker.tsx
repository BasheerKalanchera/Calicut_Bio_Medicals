import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Autocomplete, Box, TextField, Typography } from "@mui/material";
import useDebouncedValue from "../hooks/useDebouncedValue";
import { searchZones, type ZoneSearchResult } from "../services/masterData";

interface ZonePickerProps {
  value: ZoneSearchResult | null;
  onChange: (zone: ZoneSearchResult | null) => void;
  label: string;
  excludeIds?: string[];
  size?: "small" | "medium";
  fullWidth?: boolean;
  disabled?: boolean;
  // Add/Edit Hospital passes searchZonesForHospital here to scope results to
  // the rep's own territory server-side -- every other caller keeps the
  // default unrestricted searchZones.
  searchFn?: (q: string) => Promise<ZoneSearchResult[]>;
}

function optionLabel(o: ZoneSearchResult): string {
  return o.path ? `${o.name} (${o.path})` : o.name;
}

export default function ZonePicker({
  value,
  onChange,
  label,
  excludeIds = [],
  size = "small",
  fullWidth = true,
  disabled = false,
  searchFn = searchZones,
}: ZonePickerProps) {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput);

  const { data: options = [], isFetching } = useQuery({
    queryKey: ["zones", "search", searchFn === searchZones ? "all" : "hospital", debouncedSearch],
    enabled: debouncedSearch.trim().length >= 2,
    queryFn: () => searchFn(debouncedSearch.trim()),
  });

  const choices = options.filter((z) => !excludeIds.includes(z.id));

  return (
    <Autocomplete
      options={choices}
      getOptionLabel={optionLabel}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      value={value}
      loading={isFetching}
      filterOptions={(x) => x}
      onChange={(_e, newValue) => onChange(newValue)}
      onInputChange={(_e, newInputValue) => setSearchInput(newInputValue)}
      disabled={disabled}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.id}>
          <Box>
            <Typography variant="body2">{option.name}</Typography>
            {option.path && (
              <Typography variant="caption" color="info">
                {option.path}
              </Typography>
            )}
          </Box>
        </Box>
      )}
      renderInput={(params) => <TextField {...params} label={label} size={size} />}
      fullWidth={fullWidth}
    />
  );
}
