import { toPng, toSvg } from 'html-to-image';
import type { EntityFile } from '../components/CodeEditor';

/**
 * High-DPI PNG Exporter for ER Diagrams using html-to-image
 */
export async function exportElementToPng(
  targetElement: HTMLElement,
  fileName: string = 'typeorm-er-diagram.png'
): Promise<void> {
  if (!targetElement) {
    throw new Error('Target diagram element not found');
  }

  try {
    const dataUrl = await toPng(targetElement, {
      backgroundColor: '#090d16',
      pixelRatio: 2, // High resolution crisp export
      filter: (node) => {
        const className = (node as HTMLElement)?.className || '';
        if (typeof className === 'string' && className.includes('react-flow__controls')) {
          return false;
        }
        return true;
      },
    });

    triggerDownload(dataUrl, fileName);
  } catch (err) {
    console.error('PNG Export failed, fallback to canvas rasterizer:', err);
    await fallbackExportToPng(targetElement, fileName);
  }
}

/**
 * SVG Vector Exporter for ER Diagrams
 */
export async function exportElementToSvg(
  targetElement: HTMLElement,
  fileName: string = 'typeorm-er-diagram.svg'
): Promise<void> {
  if (!targetElement) {
    throw new Error('Target diagram element not found');
  }

  const dataUrl = await toSvg(targetElement, {
    backgroundColor: '#090d16',
    filter: (node) => {
      const className = (node as HTMLElement)?.className || '';
      if (typeof className === 'string' && className.includes('react-flow__controls')) {
        return false;
      }
      return true;
    },
  });

  triggerDownload(dataUrl, fileName);
}

/**
 * Saves current entity files as a JSON model project file
 */
export function saveModelToJson(files: EntityFile[], fileName: string = 'typeorm-model.json'): void {
  const data = {
    version: '1.0',
    type: 'typeorm-er-studio-project',
    createdAt: new Date().toISOString(),
    files,
  };
  const jsonStr = JSON.stringify(data, null, 2);
  saveTextFile(jsonStr, fileName, 'application/json');
}

/**
 * Parses a JSON project file into EntityFile array
 */
export async function parseModelJsonFile(file: File): Promise<EntityFile[]> {
  const text = await file.text();
  const data = JSON.parse(text);
  if (Array.isArray(data)) {
    return data;
  }
  if (data && Array.isArray(data.files)) {
    return data.files;
  }
  throw new Error('Invalid TypeORM Model JSON format');
}

/**
 * Downloads arbitrary string content as a file
 */
export function saveTextFile(content: string, fileName: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, fileName);
  URL.revokeObjectURL(url);
}

function triggerDownload(dataUrl: string, fileName: string): void {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function fallbackExportToPng(targetElement: HTMLElement, fileName: string): Promise<void> {
  const cloned = targetElement.cloneNode(true) as HTMLElement;
  cloned.querySelectorAll('.react-flow__controls, .react-flow__minimap, .react-flow__panel, .react-flow__attribution').forEach((el) => el.remove());

  const rect = targetElement.getBoundingClientRect();
  const width = Math.max(1000, Math.ceil(rect.width));
  const height = Math.max(800, Math.ceil(rect.height));

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="background-color: #090d16; width: ${width}px; height: ${height}px; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif;">
          ${cloned.outerHTML}
        </div>
      </foreignObject>
    </svg>
  `;

  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width * 2;
        canvas.height = height * 2;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#090d16';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/png');
          triggerDownload(dataUrl, fileName);
          URL.revokeObjectURL(url);
          resolve();
        } else {
          URL.revokeObjectURL(url);
          reject(new Error('Canvas context failed'));
        }
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Rasterization failed'));
    };
    img.src = url;
  });
}

