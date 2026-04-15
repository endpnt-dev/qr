/**
 * QR Code API v2 Parameter Validation
 * Validates and normalizes all v2 parameters with backwards compatibility
 */

import {
  QRParamsV2,
  ValidatedQRParams,
  ValidationError,
  QRValidationError,
  DOT_STYLES,
  EYE_STYLES,
  GRADIENT_TYPES,
  BORDER_MODES,
  ERROR_CORRECTION_LEVELS,
  OUTPUT_FORMATS,
  VALIDATION_LIMITS,
  BorderConfig,
  GradientConfig,
  OverlayConfig
} from './types';

// ============ UTILITY FUNCTIONS ============

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidHexColor(color: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(color);
}

function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

function sanitizeString(str: string, maxLength: number): string {
  return str.substring(0, maxLength).trim();
}

// ============ BASE PARAMETER VALIDATION ============

function validateBaseParams(params: QRParamsV2): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate required data field
  if (!params.data || typeof params.data !== 'string') {
    errors.push({
      field: 'data',
      message: 'Required field missing or invalid type',
      code: 'INVALID_DATA'
    });
  } else if (params.data.length > VALIDATION_LIMITS.data.max_length) {
    errors.push({
      field: 'data',
      message: `Data too long (max ${VALIDATION_LIMITS.data.max_length} chars)`,
      code: 'DATA_TOO_LONG'
    });
  }

  // Validate size
  if (params.size !== undefined) {
    if (typeof params.size !== 'number' || !isInRange(params.size, VALIDATION_LIMITS.size.min, VALIDATION_LIMITS.size.max)) {
      errors.push({
        field: 'size',
        message: `Size must be between ${VALIDATION_LIMITS.size.min} and ${VALIDATION_LIMITS.size.max}`,
        code: 'INVALID_SIZE'
      });
    }
  }

  // Validate format
  if (params.format !== undefined && !OUTPUT_FORMATS.includes(params.format as any)) {
    errors.push({
      field: 'format',
      message: `Format must be one of: ${OUTPUT_FORMATS.join(', ')}`,
      code: 'INVALID_FORMAT'
    });
  }

  // Validate colors
  if (params.color !== undefined && !isValidHexColor(params.color)) {
    errors.push({
      field: 'color',
      message: 'Color must be a valid hex color (e.g., #000000)',
      code: 'INVALID_COLOR'
    });
  }

  if (params.background !== undefined && !isValidHexColor(params.background)) {
    errors.push({
      field: 'background',
      message: 'Background must be a valid hex color (e.g., #FFFFFF)',
      code: 'INVALID_BACKGROUND'
    });
  }

  // Validate margin
  if (params.margin !== undefined) {
    if (typeof params.margin !== 'number' || !isInRange(params.margin, VALIDATION_LIMITS.margin.min, VALIDATION_LIMITS.margin.max)) {
      errors.push({
        field: 'margin',
        message: `Margin must be between ${VALIDATION_LIMITS.margin.min} and ${VALIDATION_LIMITS.margin.max}`,
        code: 'INVALID_MARGIN'
      });
    }
  }

  // Validate error correction
  if (params.error_correction !== undefined && !ERROR_CORRECTION_LEVELS.includes(params.error_correction as any)) {
    errors.push({
      field: 'error_correction',
      message: `Error correction must be one of: ${ERROR_CORRECTION_LEVELS.join(', ')}`,
      code: 'INVALID_ERROR_CORRECTION'
    });
  }

  // Validate logo_url
  if (params.logo_url !== undefined && !isValidUrl(params.logo_url)) {
    errors.push({
      field: 'logo_url',
      message: 'Logo URL must be a valid HTTP or HTTPS URL',
      code: 'INVALID_LOGO_URL'
    });
  }

  // Validate logo_size
  if (params.logo_size !== undefined) {
    if (typeof params.logo_size !== 'number' || !isInRange(params.logo_size, VALIDATION_LIMITS.logo_size.min, VALIDATION_LIMITS.logo_size.max)) {
      errors.push({
        field: 'logo_size',
        message: `Logo size must be between ${VALIDATION_LIMITS.logo_size.min} and ${VALIDATION_LIMITS.logo_size.max}`,
        code: 'INVALID_LOGO_SIZE'
      });
    }
  }

  return errors;
}

// ============ V2 STYLE PARAMETER VALIDATION ============

function validateStyleParams(params: QRParamsV2): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate dot_style
  if (params.dot_style !== undefined && !DOT_STYLES.includes(params.dot_style as any)) {
    errors.push({
      field: 'dot_style',
      message: `Dot style must be one of: ${DOT_STYLES.join(', ')}`,
      code: 'INVALID_DOT_STYLE'
    });
  }

  // Validate eye_shape
  if (params.eye_shape !== undefined && !EYE_STYLES.includes(params.eye_shape as any)) {
    errors.push({
      field: 'eye_shape',
      message: `Eye shape must be one of: ${EYE_STYLES.join(', ')}`,
      code: 'INVALID_EYE_SHAPE'
    });
  }

  // Validate eye_inner_shape
  if (params.eye_inner_shape !== undefined && !EYE_STYLES.includes(params.eye_inner_shape as any)) {
    errors.push({
      field: 'eye_inner_shape',
      message: `Eye inner shape must be one of: ${EYE_STYLES.join(', ')}`,
      code: 'INVALID_EYE_INNER_SHAPE'
    });
  }

  // Validate eye_color
  if (params.eye_color !== undefined && !isValidHexColor(params.eye_color)) {
    errors.push({
      field: 'eye_color',
      message: 'Eye color must be a valid hex color (e.g., #000000)',
      code: 'INVALID_EYE_COLOR'
    });
  }

  // Validate eye_inner_color
  if (params.eye_inner_color !== undefined && !isValidHexColor(params.eye_inner_color)) {
    errors.push({
      field: 'eye_inner_color',
      message: 'Eye inner color must be a valid hex color (e.g., #000000)',
      code: 'INVALID_EYE_INNER_COLOR'
    });
  }

  // Validate gradient
  if (params.gradient !== undefined) {
    const gradientErrors = validateGradient(params.gradient);
    errors.push(...gradientErrors);
  }

  // Validate border
  if (params.border !== undefined) {
    const borderErrors = validateBorder(params.border);
    errors.push(...borderErrors);
  }

  // Validate overlay
  if (params.overlay !== undefined) {
    const overlayErrors = validateOverlay(params.overlay);
    errors.push(...overlayErrors);
  }

  return errors;
}

function validateGradient(gradient: GradientConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate type
  if (!GRADIENT_TYPES.includes(gradient.type as any)) {
    errors.push({
      field: 'gradient.type',
      message: `Gradient type must be one of: ${GRADIENT_TYPES.join(', ')}`,
      code: 'INVALID_GRADIENT_TYPE'
    });
  }

  // Validate rotation (linear only)
  if (gradient.rotation !== undefined) {
    if (gradient.type !== 'linear') {
      errors.push({
        field: 'gradient.rotation',
        message: 'Rotation is only valid for linear gradients',
        code: 'INVALID_GRADIENT_ROTATION'
      });
    } else if (typeof gradient.rotation !== 'number' || !isInRange(gradient.rotation, 0, 360)) {
      errors.push({
        field: 'gradient.rotation',
        message: 'Rotation must be between 0 and 360 degrees',
        code: 'INVALID_GRADIENT_ROTATION'
      });
    }
  }

  // Validate colors array
  if (!Array.isArray(gradient.colors)) {
    errors.push({
      field: 'gradient.colors',
      message: 'Gradient colors must be an array',
      code: 'INVALID_GRADIENT_COLORS'
    });
  } else {
    const { min, max } = VALIDATION_LIMITS.gradient_stops;
    if (gradient.colors.length < min || gradient.colors.length > max) {
      errors.push({
        field: 'gradient.colors',
        message: `Gradient must have ${min}-${max} color stops`,
        code: 'INVALID_GRADIENT_COLORS_COUNT'
      });
    }

    // Validate each color stop
    gradient.colors.forEach((stop, index) => {
      if (typeof stop.offset !== 'number' || !isInRange(stop.offset, 0, 1)) {
        errors.push({
          field: `gradient.colors[${index}].offset`,
          message: 'Color stop offset must be between 0.0 and 1.0',
          code: 'INVALID_GRADIENT_OFFSET'
        });
      }
      if (!isValidHexColor(stop.color)) {
        errors.push({
          field: `gradient.colors[${index}].color`,
          message: 'Color stop color must be a valid hex color',
          code: 'INVALID_GRADIENT_COLOR'
        });
      }
    });
  }

  return errors;
}

function validateBorder(border: BorderConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate mode
  if (!BORDER_MODES.includes(border.mode as any)) {
    errors.push({
      field: 'border.mode',
      message: `Border mode must be one of: ${BORDER_MODES.join(', ')}`,
      code: 'INVALID_BORDER_MODE'
    });
    return errors; // Can't validate further without valid mode
  }

  switch (border.mode) {
    case 'styled':
      const styledErrors = validateBorderStyled(border);
      errors.push(...styledErrors);
      break;
    case 'image':
      const imageErrors = validateBorderImage(border);
      errors.push(...imageErrors);
      break;
    case 'svg':
      const svgErrors = validateBorderSvg(border);
      errors.push(...svgErrors);
      break;
  }

  return errors;
}

function validateBorderStyled(border: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate width
  if (border.width !== undefined) {
    const { min, max } = VALIDATION_LIMITS.border_styled_width;
    if (typeof border.width !== 'number' || !isInRange(border.width, min, max)) {
      errors.push({
        field: 'border.width',
        message: `Border width must be between ${min} and ${max}`,
        code: 'INVALID_BORDER_WIDTH'
      });
    }
  }

  // Validate color
  if (border.color !== undefined && !isValidHexColor(border.color)) {
    errors.push({
      field: 'border.color',
      message: 'Border color must be a valid hex color',
      code: 'INVALID_BORDER_COLOR'
    });
  }

  // Validate radius
  if (border.radius !== undefined) {
    const { min, max } = VALIDATION_LIMITS.border_styled_radius;
    if (typeof border.radius !== 'number' || !isInRange(border.radius, min, max)) {
      errors.push({
        field: 'border.radius',
        message: `Border radius must be between ${min} and ${max}`,
        code: 'INVALID_BORDER_RADIUS'
      });
    }
  }

  // Validate padding
  if (border.padding !== undefined) {
    const { min, max } = VALIDATION_LIMITS.border_styled_padding;
    if (typeof border.padding !== 'number' || !isInRange(border.padding, min, max)) {
      errors.push({
        field: 'border.padding',
        message: `Border padding must be between ${min} and ${max}`,
        code: 'INVALID_BORDER_PADDING'
      });
    }
  }

  // Validate label if present
  if (border.label !== undefined) {
    const labelErrors = validateBorderLabel(border.label);
    errors.push(...labelErrors);
  }

  return errors;
}

function validateBorderLabel(label: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate text
  if (typeof label.text !== 'string') {
    errors.push({
      field: 'border.label.text',
      message: 'Label text must be a string',
      code: 'INVALID_BORDER_LABEL_TEXT'
    });
  } else if (label.text.length > VALIDATION_LIMITS.border_label_max_length) {
    errors.push({
      field: 'border.label.text',
      message: `Label text too long (max ${VALIDATION_LIMITS.border_label_max_length} chars)`,
      code: 'BORDER_LABEL_TEXT_TOO_LONG'
    });
  }

  // Validate position
  if (label.position !== undefined && !['top', 'bottom'].includes(label.position)) {
    errors.push({
      field: 'border.label.position',
      message: 'Label position must be "top" or "bottom"',
      code: 'INVALID_BORDER_LABEL_POSITION'
    });
  }

  // Validate font_size
  if (label.font_size !== undefined) {
    const { min, max } = VALIDATION_LIMITS.border_label_font_size;
    if (typeof label.font_size !== 'number' || !isInRange(label.font_size, min, max)) {
      errors.push({
        field: 'border.label.font_size',
        message: `Label font size must be between ${min} and ${max}`,
        code: 'INVALID_BORDER_LABEL_FONT_SIZE'
      });
    }
  }

  // Validate font_color
  if (label.font_color !== undefined && !isValidHexColor(label.font_color)) {
    errors.push({
      field: 'border.label.font_color',
      message: 'Label font color must be a valid hex color',
      code: 'INVALID_BORDER_LABEL_FONT_COLOR'
    });
  }

  return errors;
}

function validateBorderImage(border: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate required image_url
  if (!border.image_url || !isValidUrl(border.image_url)) {
    errors.push({
      field: 'border.image_url',
      message: 'Border image URL must be a valid HTTP or HTTPS URL',
      code: 'INVALID_BORDER_IMAGE_URL'
    });
  }

  // Validate width
  if (border.width !== undefined) {
    const { min, max } = VALIDATION_LIMITS.border_image_width;
    if (typeof border.width !== 'number' || !isInRange(border.width, min, max)) {
      errors.push({
        field: 'border.width',
        message: `Border image width must be between ${min} and ${max}`,
        code: 'INVALID_BORDER_WIDTH'
      });
    }
  }

  // Validate padding
  if (border.padding !== undefined) {
    const { min, max } = VALIDATION_LIMITS.border_styled_padding;
    if (typeof border.padding !== 'number' || !isInRange(border.padding, min, max)) {
      errors.push({
        field: 'border.padding',
        message: `Border padding must be between ${min} and ${max}`,
        code: 'INVALID_BORDER_PADDING'
      });
    }
  }

  // Validate opacity
  if (border.opacity !== undefined) {
    if (typeof border.opacity !== 'number' || !isInRange(border.opacity, 0, 1)) {
      errors.push({
        field: 'border.opacity',
        message: 'Border opacity must be between 0.0 and 1.0',
        code: 'INVALID_BORDER_OPACITY'
      });
    }
  }

  return errors;
}

function validateBorderSvg(border: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate required svg_path
  if (typeof border.svg_path !== 'string') {
    errors.push({
      field: 'border.svg_path',
      message: 'SVG path must be a string',
      code: 'INVALID_SVG_PATH'
    });
  } else if (border.svg_path.length > VALIDATION_LIMITS.border_svg_path_max_length) {
    errors.push({
      field: 'border.svg_path',
      message: `SVG path too long (max ${VALIDATION_LIMITS.border_svg_path_max_length} chars)`,
      code: 'SVG_PATH_TOO_COMPLEX'
    });
  }

  // Basic SVG path safety validation
  if (typeof border.svg_path === 'string') {
    const dangerousPatterns = [
      '<script', 'javascript:', 'on[a-z]+=', 'url\\(', '<\\s*[a-z]+'
    ];
    const hasDangerousContent = dangerousPatterns.some(pattern =>
      new RegExp(pattern, 'i').test(border.svg_path)
    );
    if (hasDangerousContent) {
      errors.push({
        field: 'border.svg_path',
        message: 'SVG path contains potentially unsafe content',
        code: 'INVALID_SVG_PATH'
      });
    }
  }

  // Validate required viewBox
  if (typeof border.viewBox !== 'string') {
    errors.push({
      field: 'border.viewBox',
      message: 'SVG viewBox must be a string',
      code: 'INVALID_SVG_VIEWBOX'
    });
  }

  // Validate stroke_color
  if (border.stroke_color !== undefined && !isValidHexColor(border.stroke_color)) {
    errors.push({
      field: 'border.stroke_color',
      message: 'SVG stroke color must be a valid hex color',
      code: 'INVALID_SVG_STROKE_COLOR'
    });
  }

  // Validate stroke_width
  if (border.stroke_width !== undefined) {
    const { min, max } = VALIDATION_LIMITS.border_svg_stroke_width;
    if (typeof border.stroke_width !== 'number' || !isInRange(border.stroke_width, min, max)) {
      errors.push({
        field: 'border.stroke_width',
        message: `SVG stroke width must be between ${min} and ${max}`,
        code: 'INVALID_SVG_STROKE_WIDTH'
      });
    }
  }

  // Validate fill
  if (border.fill !== undefined && border.fill !== 'none' && !isValidHexColor(border.fill)) {
    errors.push({
      field: 'border.fill',
      message: 'SVG fill must be a valid hex color or "none"',
      code: 'INVALID_SVG_FILL'
    });
  }

  // Validate padding
  if (border.padding !== undefined) {
    const { min, max } = VALIDATION_LIMITS.border_styled_padding;
    if (typeof border.padding !== 'number' || !isInRange(border.padding, min, max)) {
      errors.push({
        field: 'border.padding',
        message: `Border padding must be between ${min} and ${max}`,
        code: 'INVALID_BORDER_PADDING'
      });
    }
  }

  return errors;
}

function validateOverlay(overlay: OverlayConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate required photo_url
  if (!overlay.photo_url || !isValidUrl(overlay.photo_url)) {
    errors.push({
      field: 'overlay.photo_url',
      message: 'Overlay photo URL must be a valid HTTP or HTTPS URL',
      code: 'INVALID_OVERLAY_PHOTO_URL'
    });
  }

  // Validate position
  if (!overlay.position || typeof overlay.position !== 'object') {
    errors.push({
      field: 'overlay.position',
      message: 'Overlay position must be an object with x and y properties',
      code: 'INVALID_OVERLAY_POSITION'
    });
  } else {
    if (typeof overlay.position.x !== 'number' || !isInRange(overlay.position.x, 0, 1)) {
      errors.push({
        field: 'overlay.position.x',
        message: 'Overlay position x must be between 0.0 and 1.0',
        code: 'INVALID_OVERLAY_POSITION_X'
      });
    }
    if (typeof overlay.position.y !== 'number' || !isInRange(overlay.position.y, 0, 1)) {
      errors.push({
        field: 'overlay.position.y',
        message: 'Overlay position y must be between 0.0 and 1.0',
        code: 'INVALID_OVERLAY_POSITION_Y'
      });
    }
  }

  // Validate qr_size
  if (overlay.qr_size !== undefined) {
    const { min, max } = VALIDATION_LIMITS.overlay_qr_size;
    if (typeof overlay.qr_size !== 'number' || !isInRange(overlay.qr_size, min, max)) {
      errors.push({
        field: 'overlay.qr_size',
        message: `Overlay QR size must be between ${min} and ${max}`,
        code: 'INVALID_OVERLAY_QR_SIZE'
      });
    }
  }

  // Validate opacity
  if (overlay.opacity !== undefined) {
    const { min, max } = VALIDATION_LIMITS.overlay_opacity;
    if (typeof overlay.opacity !== 'number' || !isInRange(overlay.opacity, min, max)) {
      errors.push({
        field: 'overlay.opacity',
        message: `Overlay opacity must be between ${min} and ${max}`,
        code: 'INVALID_OVERLAY_OPACITY'
      });
    }
  }

  return errors;
}

// ============ CROSS-PARAMETER VALIDATION ============

function validateCrossParams(params: QRParamsV2): ValidationError[] {
  const errors: ValidationError[] = [];

  // SVG format incompatibilities
  if (params.format === 'svg') {
    // SVG + image border not supported
    if (params.border?.mode === 'image') {
      errors.push({
        field: 'format',
        message: 'SVG format is not supported with image borders (requires raster compositing)',
        code: 'SVG_IMAGE_BORDER_NOT_SUPPORTED'
      });
    }

    // SVG + overlay not supported
    if (params.overlay) {
      errors.push({
        field: 'format',
        message: 'SVG format is not supported with overlay (requires raster compositing)',
        code: 'SVG_OVERLAY_NOT_SUPPORTED'
      });
    }
  }

  // Logo with non-square dots requires higher error correction
  if (params.logo_url && params.dot_style && params.dot_style !== 'square') {
    if (!params.error_correction || params.error_correction === 'L') {
      // This will be auto-corrected with a warning, not an error
    }
  }

  // Low opacity overlay warning (not an error, but will generate warning)
  if (params.overlay?.opacity !== undefined && params.overlay.opacity < 0.5) {
    // This will generate a warning in the processing pipeline
  }

  return errors;
}

// ============ MAIN VALIDATION FUNCTION ============

export function validateQRParams(params: QRParamsV2): ValidatedQRParams {
  const errors: ValidationError[] = [];

  // Validate all parameter categories
  errors.push(...validateBaseParams(params));
  errors.push(...validateStyleParams(params));
  errors.push(...validateCrossParams(params));

  // Throw if any validation errors
  if (errors.length > 0) {
    throw new QRValidationError(errors);
  }

  // Apply defaults and return validated params
  const validated: ValidatedQRParams = {
    // Base parameters with defaults
    data: params.data!,
    size: params.size ?? 400,
    format: params.format ?? 'png',
    color: params.color ?? '#000000',
    background: params.background ?? '#FFFFFF',
    margin: params.margin ?? 4,
    error_correction: params.error_correction ?? 'M',
    logo_url: params.logo_url,
    logo_size: params.logo_size ?? 20,

    // V2 style parameters (keep as-is, defaults applied at render time)
    dot_style: params.dot_style,
    eye_shape: params.eye_shape,
    eye_inner_shape: params.eye_inner_shape,
    eye_color: params.eye_color,
    eye_inner_color: params.eye_inner_color,
    gradient: params.gradient,
    border: params.border,
    overlay: params.overlay
  };

  return validated;
}