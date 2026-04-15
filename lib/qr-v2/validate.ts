import { 
  QRParamsV2, 
  ValidatedQRParams, 
  QRValidationError,
  QRGradientStop,
  BorderStyled,
  BorderImage,
  BorderSVG,
  QROverlay
} from './types';
import { QR_LIMITS, QR_V2_LIMITS, QR_V2_DEFAULTS, SUPPORTED_FORMATS } from '../config';

export function validateQRParams(params: QRParamsV2): ValidatedQRParams {
  const errors: { field: string; message: string }[] = [];

  // Validate data (required)
  if (!params.data || typeof params.data !== 'string') {
    errors.push({ field: 'data', message: 'Data is required and must be a string' });
  } else if (params.data.length > QR_LIMITS.data_max_length) {
    errors.push({ field: 'data', message: `Data must be ${QR_LIMITS.data_max_length} characters or less` });
  }

  // Validate size
  const size = params.size ?? 400;
  if (size < QR_LIMITS.size.min || size > QR_LIMITS.size.max) {
    errors.push({ field: 'size', message: `Size must be between ${QR_LIMITS.size.min} and ${QR_LIMITS.size.max}` });
  }

  // Validate format
  const format = params.format ?? 'png';
  if (!SUPPORTED_FORMATS.includes(format as any)) {
    errors.push({ field: 'format', message: `Format must be one of: ${SUPPORTED_FORMATS.join(', ')}` });
  }

  // Validate color
  const color = params.color ?? '#000000';
  if (!isValidHexColor(color)) {
    errors.push({ field: 'color', message: 'Color must be a valid hex color (e.g., #000000)' });
  }

  // Validate background
  const background = params.background ?? '#FFFFFF';
  if (!isValidHexColor(background)) {
    errors.push({ field: 'background', message: 'Background must be a valid hex color (e.g., #FFFFFF)' });
  }

  // Validate margin
  const margin = params.margin ?? 4;
  if (margin < QR_LIMITS.margin.min || margin > QR_LIMITS.margin.max) {
    errors.push({ field: 'margin', message: `Margin must be between ${QR_LIMITS.margin.min} and ${QR_LIMITS.margin.max}` });
  }

  // Validate error correction
  const errorCorrection = params.error_correction ?? 'M';
  if (!['L', 'M', 'Q', 'H'].includes(errorCorrection)) {
    errors.push({ field: 'error_correction', message: 'Error correction must be L, M, Q, or H' });
  }

  // Validate logo_url and logo_size
  let logoUrl: string | undefined;
  let logoSize: number | undefined;
  if (params.logo_url) {
    if (!isValidHttpUrl(params.logo_url)) {
      errors.push({ field: 'logo_url', message: 'Logo URL must be a valid HTTP or HTTPS URL' });
    } else {
      logoUrl = params.logo_url;
      logoSize = params.logo_size ?? 20;
      if (logoSize < QR_LIMITS.logo_size.min || logoSize > QR_LIMITS.logo_size.max) {
        errors.push({ field: 'logo_size', message: `Logo size must be between ${QR_LIMITS.logo_size.min} and ${QR_LIMITS.logo_size.max}` });
      }
    }
  }

  // Validate dot_style
  const dotStyle = params.dot_style ?? QR_V2_DEFAULTS.dot_style;
  const validDotStyles = ['square', 'dot', 'rounded', 'extra-rounded', 'classy', 'classy-rounded'];
  if (!validDotStyles.includes(dotStyle)) {
    errors.push({ field: 'dot_style', message: `Dot style must be one of: ${validDotStyles.join(', ')}` });
  }

  // Validate eye_shape
  const eyeShape = params.eye_shape ?? QR_V2_DEFAULTS.eye_shape;
  const validEyeShapes = ['square', 'dot', 'rounded', 'classy'];
  if (!validEyeShapes.includes(eyeShape)) {
    errors.push({ field: 'eye_shape', message: `Eye shape must be one of: ${validEyeShapes.join(', ')}` });
  }

  // Validate eye_inner_shape
  const eyeInnerShape = params.eye_inner_shape ?? QR_V2_DEFAULTS.eye_inner_shape;
  if (!validEyeShapes.includes(eyeInnerShape)) {
    errors.push({ field: 'eye_inner_shape', message: `Eye inner shape must be one of: ${validEyeShapes.join(', ')}` });
  }

  // Validate eye colors
  let eyeColor: string | undefined;
  let eyeInnerColor: string | undefined;
  if (params.eye_color) {
    if (!isValidHexColor(params.eye_color)) {
      errors.push({ field: 'eye_color', message: 'Eye color must be a valid hex color' });
    } else {
      eyeColor = params.eye_color;
    }
  }
  if (params.eye_inner_color) {
    if (!isValidHexColor(params.eye_inner_color)) {
      errors.push({ field: 'eye_inner_color', message: 'Eye inner color must be a valid hex color' });
    } else {
      eyeInnerColor = params.eye_inner_color;
    }
  }

  // Validate gradient
  let gradient: typeof params.gradient;
  if (params.gradient) {
    const gradientErrors = validateGradient(params.gradient);
    errors.push(...gradientErrors);
    if (gradientErrors.length === 0) {
      gradient = params.gradient;
    }
  }

  // Validate border
  let border: typeof params.border;
  if (params.border) {
    const borderErrors = validateBorder(params.border, format);
    errors.push(...borderErrors);
    if (borderErrors.length === 0) {
      border = params.border;
    }
  }

  // Validate overlay
  let overlay: typeof params.overlay;
  if (params.overlay) {
    const overlayErrors = validateOverlay(params.overlay, format);
    errors.push(...overlayErrors);
    if (overlayErrors.length === 0) {
      overlay = params.overlay;
    }
  }

  if (errors.length > 0) {
    throw new QRValidationError(errors);
  }

  return {
    data: params.data!,
    size,
    format: format as 'png' | 'svg' | 'jpeg' | 'webp',
    color,
    background,
    margin,
    error_correction: errorCorrection as 'L' | 'M' | 'Q' | 'H',
    logo_url: logoUrl,
    logo_size: logoSize,
    dot_style: dotStyle as any,
    eye_shape: eyeShape as any,
    eye_inner_shape: eyeInnerShape as any,
    eye_color: eyeColor,
    eye_inner_color: eyeInnerColor,
    gradient,
    border,
    overlay,
  };
}

function validateGradient(gradient: any): { field: string; message: string }[] {
  const errors: { field: string; message: string }[] = [];

  if (!gradient.type || !['linear', 'radial'].includes(gradient.type)) {
    errors.push({ field: 'gradient.type', message: 'Gradient type must be "linear" or "radial"' });
  }

  if (gradient.rotation !== undefined) {
    if (typeof gradient.rotation !== 'number' || gradient.rotation < 0 || gradient.rotation > 360) {
      errors.push({ field: 'gradient.rotation', message: 'Gradient rotation must be a number between 0 and 360' });
    }
  }

  if (!Array.isArray(gradient.colors) || gradient.colors.length < 2 || gradient.colors.length > QR_V2_LIMITS.gradient_max_stops) {
    errors.push({ field: 'gradient.colors', message: `Gradient must have 2-${QR_V2_LIMITS.gradient_max_stops} color stops` });
  } else {
    gradient.colors.forEach((stop: QRGradientStop, index: number) => {
      if (typeof stop.offset !== 'number' || stop.offset < 0 || stop.offset > 1) {
        errors.push({ field: `gradient.colors[${index}].offset`, message: 'Offset must be a number between 0 and 1' });
      }
      if (!isValidHexColor(stop.color)) {
        errors.push({ field: `gradient.colors[${index}].color`, message: 'Color must be a valid hex color' });
      }
    });
  }

  return errors;
}

function validateBorder(border: any, format: string): { field: string; message: string }[] {
  const errors: { field: string; message: string }[] = [];

  if (!border.mode || !['styled', 'image', 'svg'].includes(border.mode)) {
    errors.push({ field: 'border.mode', message: 'Border mode must be "styled", "image", or "svg"' });
    return errors;
  }

  // SVG format is incompatible with image borders and overlays
  if (format === 'svg' && ['image', 'svg'].includes(border.mode)) {
    errors.push({ field: 'border', message: 'SVG output format is incompatible with image and SVG borders' });
    return errors;
  }

  if (border.mode === 'styled') {
    return validateStyledBorder(border as BorderStyled);
  } else if (border.mode === 'image') {
    return validateImageBorder(border as BorderImage);
  } else if (border.mode === 'svg') {
    return validateSVGBorder(border as BorderSVG);
  }

  return errors;
}

function validateStyledBorder(border: BorderStyled): { field: string; message: string }[] {
  const errors: { field: string; message: string }[] = [];

  if (typeof border.width !== 'number' || border.width < QR_V2_LIMITS.border_width.min || border.width > QR_V2_LIMITS.border_width.max) {
    errors.push({ field: 'border.width', message: `Border width must be between ${QR_V2_LIMITS.border_width.min} and ${QR_V2_LIMITS.border_width.max}` });
  }

  if (!isValidHexColor(border.color)) {
    errors.push({ field: 'border.color', message: 'Border color must be a valid hex color' });
  }

  if (border.radius !== undefined) {
    if (typeof border.radius !== 'number' || border.radius < QR_V2_LIMITS.border_radius.min || border.radius > QR_V2_LIMITS.border_radius.max) {
      errors.push({ field: 'border.radius', message: `Border radius must be between ${QR_V2_LIMITS.border_radius.min} and ${QR_V2_LIMITS.border_radius.max}` });
    }
  }

  if (border.padding !== undefined) {
    if (typeof border.padding !== 'number' || border.padding < QR_V2_LIMITS.border_padding.min || border.padding > QR_V2_LIMITS.border_padding.max) {
      errors.push({ field: 'border.padding', message: `Border padding must be between ${QR_V2_LIMITS.border_padding.min} and ${QR_V2_LIMITS.border_padding.max}` });
    }
  }

  if (border.label) {
    if (!border.label.text || typeof border.label.text !== 'string') {
      errors.push({ field: 'border.label.text', message: 'Label text is required and must be a string' });
    } else if (border.label.text.length > QR_V2_LIMITS.border_label_max_length) {
      errors.push({ field: 'border.label.text', message: `Label text must be ${QR_V2_LIMITS.border_label_max_length} characters or less` });
    }

    if (border.label.position && !['top', 'bottom'].includes(border.label.position)) {
      errors.push({ field: 'border.label.position', message: 'Label position must be "top" or "bottom"' });
    }

    if (border.label.font_size !== undefined) {
      if (typeof border.label.font_size !== 'number' || border.label.font_size < QR_V2_LIMITS.border_label_font_size.min || border.label.font_size > QR_V2_LIMITS.border_label_font_size.max) {
        errors.push({ field: 'border.label.font_size', message: `Label font size must be between ${QR_V2_LIMITS.border_label_font_size.min} and ${QR_V2_LIMITS.border_label_font_size.max}` });
      }
    }

    if (border.label.font_color && !isValidHexColor(border.label.font_color)) {
      errors.push({ field: 'border.label.font_color', message: 'Label font color must be a valid hex color' });
    }
  }

  return errors;
}

function validateImageBorder(border: BorderImage): { field: string; message: string }[] {
  const errors: { field: string; message: string }[] = [];

  if (!isValidHttpUrl(border.image_url)) {
    errors.push({ field: 'border.image_url', message: 'Border image URL must be a valid HTTP or HTTPS URL' });
  }

  if (typeof border.width !== 'number' || border.width < QR_V2_LIMITS.border_width.min || border.width > QR_V2_LIMITS.border_width.max) {
    errors.push({ field: 'border.width', message: `Border width must be between ${QR_V2_LIMITS.border_width.min} and ${QR_V2_LIMITS.border_width.max}` });
  }

  if (border.padding !== undefined) {
    if (typeof border.padding !== 'number' || border.padding < QR_V2_LIMITS.border_padding.min || border.padding > QR_V2_LIMITS.border_padding.max) {
      errors.push({ field: 'border.padding', message: `Border padding must be between ${QR_V2_LIMITS.border_padding.min} and ${QR_V2_LIMITS.border_padding.max}` });
    }
  }

  if (border.opacity !== undefined) {
    if (typeof border.opacity !== 'number' || border.opacity < QR_V2_LIMITS.border_opacity.min || border.opacity > QR_V2_LIMITS.border_opacity.max) {
      errors.push({ field: 'border.opacity', message: `Border opacity must be between ${QR_V2_LIMITS.border_opacity.min} and ${QR_V2_LIMITS.border_opacity.max}` });
    }
  }

  return errors;
}

function validateSVGBorder(border: BorderSVG): { field: string; message: string }[] {
  const errors: { field: string; message: string }[] = [];

  if (!border.svg_path || typeof border.svg_path !== 'string') {
    errors.push({ field: 'border.svg_path', message: 'SVG path is required and must be a string' });
  } else if (border.svg_path.length > QR_V2_LIMITS.svg_path_max_length) {
    errors.push({ field: 'border.svg_path', message: `SVG path must be ${QR_V2_LIMITS.svg_path_max_length} characters or less` });
  }

  if (border.viewBox && !/^\d+\s+\d+\s+\d+\s+\d+$/.test(border.viewBox)) {
    errors.push({ field: 'border.viewBox', message: 'ViewBox must be in format "x y width height" (e.g., "0 0 200 200")' });
  }

  if (border.stroke_color && !isValidHexColor(border.stroke_color)) {
    errors.push({ field: 'border.stroke_color', message: 'Stroke color must be a valid hex color' });
  }

  if (border.stroke_width !== undefined) {
    if (typeof border.stroke_width !== 'number' || border.stroke_width < QR_V2_LIMITS.svg_stroke_width.min || border.stroke_width > QR_V2_LIMITS.svg_stroke_width.max) {
      errors.push({ field: 'border.stroke_width', message: `Stroke width must be between ${QR_V2_LIMITS.svg_stroke_width.min} and ${QR_V2_LIMITS.svg_stroke_width.max}` });
    }
  }

  return errors;
}

function validateOverlay(overlay: QROverlay, format: string): { field: string; message: string }[] {
  const errors: { field: string; message: string }[] = [];

  // SVG format is incompatible with overlays
  if (format === 'svg') {
    errors.push({ field: 'overlay', message: 'SVG output format is incompatible with overlays' });
    return errors;
  }

  if (!isValidHttpUrl(overlay.photo_url)) {
    errors.push({ field: 'overlay.photo_url', message: 'Overlay photo URL must be a valid HTTP or HTTPS URL' });
  }

  if (!overlay.position || typeof overlay.position.x !== 'number' || typeof overlay.position.y !== 'number') {
    errors.push({ field: 'overlay.position', message: 'Position must be an object with x and y coordinates' });
  } else {
    if (overlay.position.x < 0 || overlay.position.x > 1) {
      errors.push({ field: 'overlay.position.x', message: 'Position x must be between 0 and 1' });
    }
    if (overlay.position.y < 0 || overlay.position.y > 1) {
      errors.push({ field: 'overlay.position.y', message: 'Position y must be between 0 and 1' });
    }
  }

  if (overlay.qr_size !== undefined) {
    if (typeof overlay.qr_size !== 'number' || overlay.qr_size < QR_V2_LIMITS.overlay_qr_size.min || overlay.qr_size > QR_V2_LIMITS.overlay_qr_size.max) {
      errors.push({ field: 'overlay.qr_size', message: `QR size must be between ${QR_V2_LIMITS.overlay_qr_size.min} and ${QR_V2_LIMITS.overlay_qr_size.max}` });
    }
  }

  if (overlay.opacity !== undefined) {
    if (typeof overlay.opacity !== 'number' || overlay.opacity < QR_V2_LIMITS.overlay_opacity.min || overlay.opacity > QR_V2_LIMITS.overlay_opacity.max) {
      errors.push({ field: 'overlay.opacity', message: `Overlay opacity must be between ${QR_V2_LIMITS.overlay_opacity.min} and ${QR_V2_LIMITS.overlay_opacity.max}` });
    }
  }

  return errors;
}

function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
