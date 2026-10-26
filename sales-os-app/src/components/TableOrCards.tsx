import { createContext, useContext, type ReactNode } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import useIsPhone from "../hooks/useIsPhone";

// A table on a tablet or laptop, one card per row on a phone (Frontend
// standards §6.11 rule 2; Part 2 plan D10). MUI has no ready-made part for
// this, so the cards are MUI's own Card: the row's name is the card's
// title, a chevron (if any) sits left of it, actions sit on the right, and
// every other column becomes a "Label: value" line under the title.
//
//   <TableOrCards columns={[{ toggle: true }, { label: "Rep" }, { label: "Amount" }, { label: "Actions", align: "right" }]}>
//     <TocRow indent={depth} detail={open && <Details />}>
//       <TocCell toggle><ExpandToggle /></TocCell>
//       <TocCell title>{name}</TocCell>
//       <TocCell label="Amount">{amount}</TocCell>
//       <TocCell action align="right"><Button /></TocCell>
//     </TocRow>
//   </TableOrCards>
//
// A row's `indent` pushes its card in on a phone (the reporting tree, rule
// 10) and its title in on a laptop. A row's `subRows` (e.g. a person's four
// quarters) are rows of the table on a laptop and sit inside the card on a
// phone.

export interface TocColumn {
  label?: ReactNode;
  align?: "left" | "right";
  width?: string | number;
  // The chevron column: narrow on a laptop, left of the title on a phone.
  toggle?: boolean;
}

interface TocContextValue {
  phone: boolean;
  columnCount: number;
  // True inside a phone card (a sub-row): no card of its own.
  nested: boolean;
}

const TocContext = createContext<TocContextValue>({ phone: false, columnCount: 1, nested: false });

export default function TableOrCards({
  columns,
  children,
  stickyHeader,
}: {
  columns: TocColumn[];
  children: ReactNode;
  stickyHeader?: boolean;
}) {
  const phone = useIsPhone();
  const value = { phone, columnCount: columns.length, nested: false };

  if (phone) {
    return (
      <TocContext.Provider value={value}>
        {/* gap, not Stack's spacing: spacing zeroes each card's margin and
            so would undo a row's push-in. */}
        <Stack useFlexGap spacing={1}>{children}</Stack>
      </TocContext.Provider>
    );
  }
  return (
    <TocContext.Provider value={value}>
      <Table size="small" stickyHeader={stickyHeader}>
        <TableHead>
          <TableRow>
            {columns.map((c, i) => (
              <TableCell key={i} align={c.align} padding={c.toggle ? "checkbox" : undefined} sx={c.width !== undefined ? { width: c.width } : undefined}>
                {c.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>{children}</TableBody>
      </Table>
    </TocContext.Provider>
  );
}

export function TocRow({
  children,
  indent = 0,
  total = false,
  detail,
  subRows,
}: {
  children: ReactNode;
  // Depth in the reporting tree.
  indent?: number;
  // A total line (bold, rule above it on a laptop).
  total?: boolean;
  // Opened detail under the row; a falsy value shows nothing.
  detail?: ReactNode;
  subRows?: ReactNode;
}) {
  const ctx = useContext(TocContext);

  if (!ctx.phone) {
    const rowSx: SxProps<Theme> = {
      ...(total && { "& > td": { fontWeight: 700, borderTop: "2px solid", borderColor: "divider" } }),
      ...(detail && { "& > td": { borderBottom: "none" } }),
    };
    return (
      <TocIndentContext.Provider value={indent}>
        <TableRow sx={rowSx}>{children}</TableRow>
        {detail && (
          <TableRow>
            <TableCell colSpan={ctx.columnCount}>{detail}</TableCell>
          </TableRow>
        )}
        {subRows}
      </TocIndentContext.Provider>
    );
  }

  const content = (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "auto minmax(0, 1fr) auto",
        rowGap: 0.5,
        alignItems: "center",
      }}
    >
      {children}
      {detail && <Box sx={{ gridColumn: "1 / -1", mt: 1 }}>{detail}</Box>}
      {subRows && (
        <Box sx={{ gridColumn: "1 / -1" }}>
          <TocContext.Provider value={{ ...ctx, nested: true }}>{subRows}</TocContext.Provider>
        </Box>
      )}
    </Box>
  );

  if (ctx.nested) {
    return <Box sx={{ borderTop: 1, borderColor: "divider", pt: 0.75, mt: 0.75 }}>{content}</Box>;
  }
  return (
    <Card variant="outlined" sx={{ ml: indent * 2 }}>
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>{content}</CardContent>
    </Card>
  );
}

// The row's depth, for the title cell's push-in on a laptop.
const TocIndentContext = createContext(0);

export function TocCell({
  children,
  label,
  title = false,
  toggle = false,
  action = false,
  field = false,
  align,
  colSpan,
  phone = true,
  sx,
}: {
  children?: ReactNode;
  // Shown before the value on a phone ("Label: value").
  label?: string;
  // The row's name: the card's title on a phone.
  title?: boolean;
  // The row's chevron: left of the title on a phone.
  toggle?: boolean;
  // Buttons: right of the title on a phone.
  action?: boolean;
  // A form control: on a phone its label sits above it and it takes the
  // card's full width.
  field?: boolean;
  align?: "left" | "right";
  // Laptop only: columns this cell spans.
  colSpan?: number;
  // False hides the cell on a phone.
  phone?: boolean;
  sx?: SxProps<Theme>;
}) {
  const ctx = useContext(TocContext);
  const indent = useContext(TocIndentContext);

  if (!ctx.phone) {
    return (
      <TableCell
        align={align}
        colSpan={colSpan}
        padding={toggle ? "checkbox" : undefined}
        sx={[title && indent > 0 ? { pl: 2 + indent * 2 } : {}, ...(Array.isArray(sx) ? sx : [sx])]}
      >
        {children}
      </TableCell>
    );
  }

  if (!phone) return null;
  if (toggle) {
    return <Box sx={{ gridColumn: 1, gridRow: 1, mr: 0.5 }}>{children}</Box>;
  }
  if (title) {
    return (
      <Box sx={[{ gridColumn: 2, gridRow: 1, fontWeight: 700, overflowWrap: "anywhere" }, ...(Array.isArray(sx) ? sx : [sx])]}>
        {children}
      </Box>
    );
  }
  if (action) {
    return (
      <Box sx={{ gridColumn: 3, gridRow: 1, display: "flex", justifyContent: "flex-end", ml: 1 }}>{children}</Box>
    );
  }
  if (field) {
    return (
      <Box sx={{ gridColumn: "2 / -1", mt: 0.5 }}>
        {label && <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{label}</Typography>}
        {children}
      </Box>
    );
  }
  return (
    <Box sx={[{ gridColumn: "2 / -1", display: "flex", flexWrap: "wrap", columnGap: 0.5, alignItems: "baseline", typography: "body2" }, ...(Array.isArray(sx) ? sx : [sx])]}>
      {label && <Typography variant="body2" color="text.secondary" component="span">{label}:</Typography>}
      <Box component="span" sx={{ minWidth: 0, overflowWrap: "anywhere" }}>{children}</Box>
    </Box>
  );
}

// A line across the whole table (a group heading, an empty or loading
// message): a full-width row on a laptop, plain text between the cards on a
// phone.
export function TocMessage({ children }: { children: ReactNode }) {
  const ctx = useContext(TocContext);
  if (ctx.phone) return <Box sx={{ px: 0.5, py: 0.5 }}>{children}</Box>;
  return (
    <TableRow>
      <TableCell colSpan={ctx.columnCount}>{children}</TableCell>
    </TableRow>
  );
}
