import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  WidthType,
  BorderStyle,
  HeadingLevel,
  ShadingType,
  PageBreak,
} from 'docx';
import { saveAs } from 'file-saver';
import type { Order, InventoryItem, Partner } from '@/store/useStore';

/* ─── Shared Styling Constants ─── */

const BRAND_COLOR = '111111';
const ACCENT_COLOR = '10B981';
const GRAY_COLOR = '6B7280';
const LIGHT_BG = 'F9FAFB';

const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
  left: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
  right: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
} as const;

const headerCellBorders = {
  top: { style: BorderStyle.SINGLE, size: 2, color: BRAND_COLOR },
  bottom: { style: BorderStyle.SINGLE, size: 2, color: BRAND_COLOR },
  left: { style: BorderStyle.SINGLE, size: 1, color: BRAND_COLOR },
  right: { style: BorderStyle.SINGLE, size: 1, color: BRAND_COLOR },
} as const;

/* ─── Helpers ─── */

function resolveOrderData(
  order: Order,
  inventory: InventoryItem[],
  partners: Partner[]
) {
  const item = inventory.find((i) => i.id === order.itemId);
  const requester = partners.find((p) => p.id === order.requesterId);
  const target = partners.find((p) => p.id === order.targetId);
  return {
    itemName: item?.name ?? 'Unknown Item',
    itemPrice: item?.price ?? 0,
    requesterName: requester?.name ?? order.requesterId,
    targetName: target?.name ?? order.targetId,
    lineTotal: (item?.price ?? 0) * order.quantity,
  };
}

function makeHeaderCell(text: string, width?: number): TableCell {
  return new TableCell({
    borders: headerCellBorders,
    shading: { type: ShadingType.SOLID, color: BRAND_COLOR, fill: BRAND_COLOR },
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    children: [
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({
            text: text.toUpperCase(),
            bold: true,
            size: 16,
            font: 'Consolas',
            color: 'FFFFFF',
          }),
        ],
      }),
    ],
  });
}

function makeDataCell(text: string, bold = false): TableCell {
  return new TableCell({
    borders: cellBorders,
    children: [
      new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text,
            size: 18,
            font: 'Calibri',
            bold,
            color: bold ? BRAND_COLOR : GRAY_COLOR,
          }),
        ],
      }),
    ],
  });
}

/* ─── Single Order Log ─── */

export async function generateSingleOrderLog(
  order: Order,
  inventory: InventoryItem[],
  partners: Partner[],
  orgName: string
) {
  const data = resolveOrderData(order, inventory, partners);

  const doc = new Document({
    sections: [
      {
        children: [
          // Header
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: 'KIRANAPULSE',
                bold: true,
                size: 28,
                font: 'Consolas',
                color: BRAND_COLOR,
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: 'SUPPLY CHAIN PLATFORM — ORDER LOG',
                size: 16,
                font: 'Consolas',
                color: GRAY_COLOR,
              }),
            ],
          }),

          // Divider
          new Paragraph({
            spacing: { before: 200, after: 200 },
            border: {
              bottom: { style: BorderStyle.SINGLE, size: 3, color: BRAND_COLOR },
            },
            children: [],
          }),

          // Order title
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: `Order: ${data.itemName}`,
                bold: true,
                size: 32,
                font: 'Calibri',
                color: BRAND_COLOR,
              }),
            ],
          }),

          // Details table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [makeHeaderCell('Field', 35), makeHeaderCell('Value', 65)],
              }),
              ...([
                ['Order ID', order.id],
                ['Status', order.status.toUpperCase()],
                ['Item', data.itemName],
                ['Quantity', `${order.quantity} units`],
                ['Unit Price', `$${data.itemPrice.toFixed(2)}`],
                ['Total Value', `$${data.lineTotal.toFixed(2)}`],
                ['Requester', data.requesterName],
                ['Supplier', data.targetName],
                ['Organization', orgName],
                ['Timestamp', new Date(order.timestamp).toLocaleString()],
              ] as [string, string][]).map(
                ([field, value]) =>
                  new TableRow({
                    children: [makeDataCell(field, true), makeDataCell(value)],
                  })
              ),
            ],
          }),

          // Footer
          new Paragraph({
            spacing: { before: 400 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Generated by KiranaPulse • ${new Date().toLocaleString()}`,
                size: 14,
                font: 'Consolas',
                color: GRAY_COLOR,
                italics: true,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Order_LOG_${order.id.slice(0, 10)}.docx`);
}

/* ─── Bulk Logbook ─── */

export async function generateLogbook(
  orders: Order[],
  inventory: InventoryItem[],
  partners: Partner[],
  orgName: string,
  filterLabel: string
) {
  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear().toString();

  // Create Header Table for Month/Year
  const monthYearTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            borders: {
               top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
               bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
               left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
               right: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
            },
            children: [
              new Paragraph({
                spacing: { before: 60, after: 60 },
                children: [
                  new TextRun({ text: "  Month :-  ", bold: true, font: 'Calibri', size: 20 }),
                  new TextRun({ text: currentMonth, font: 'Calibri', size: 20 })
                ]
              })
            ]
          }),
          new TableCell({
             width: { size: 10, type: WidthType.PERCENTAGE },
             borders: {
               top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
               bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
               left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
               right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
             },
             children: [new Paragraph("")]
          }),
          new TableCell({
            width: { size: 45, type: WidthType.PERCENTAGE },
            borders: {
               top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
               bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
               left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
               right: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
            },
            children: [
              new Paragraph({
                spacing: { before: 60, after: 60 },
                children: [
                  new TextRun({ text: "  Year :-  ", bold: true, font: 'Calibri', size: 20 }),
                  new TextRun({ text: currentYear, font: 'Calibri', size: 20 })
                ]
              })
            ]
          })
        ]
      })
    ]
  });

  const headers = ["No", "Date", "Description", "Quantity", "Price", "Location", "Sign"];
  const simpleHeaderBorders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  };

  const createSimpleCell = (text: string, bold = false) => {
    return new TableCell({
      borders: simpleHeaderBorders,
      children: [
        new Paragraph({
          spacing: { before: 60, after: 60 },
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text, bold, font: 'Calibri', size: 18, color: "000000" })]
        })
      ]
    });
  };

  const headerRow = new TableRow({
    children: headers.map(h => createSimpleCell(h, true))
  });

  const dataRows = orders.map((order, index) => {
    const d = resolveOrderData(order, inventory, partners);
    const location = d.targetName;
    const desc = d.itemName;
    return new TableRow({
      children: [
        createSimpleCell(`${index + 1}`),
        createSimpleCell(new Date(order.timestamp).toLocaleDateString()),
        createSimpleCell(desc),
        createSimpleCell(`${order.quantity}`),
        createSimpleCell(`$${d.itemPrice.toFixed(2)}`),
        createSimpleCell(location),
        createSimpleCell("") // Sign
      ]
    });
  });

  const emptyRowsCount = Math.max(25 - orders.length, 5);
  const emptyRows = Array.from({ length: emptyRowsCount }).map(() => {
    return new TableRow({
      children: headers.map(() => createSimpleCell(""))
    });
  });

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: "Inventory Tracker Logbook",
                bold: true,
                size: 32,
                font: 'Times New Roman'
              })
            ]
          }),
          monthYearTable,
          new Paragraph({ spacing: { before: 100 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...dataRows, ...emptyRows]
          })
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const dateStr = new Date().toISOString().slice(0, 10);
  saveAs(blob, `Inventory_Tracker_Logbook_${dateStr}.docx`);
}
