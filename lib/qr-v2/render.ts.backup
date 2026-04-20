/**
 * QR Code Rendering Module
 * Handles QR code generation using @qr-platform/qr-code.js with styling options
 */

import { QRCodeJs } from '@qr-platform/qr-code.js';
import {
  ValidatedQRParams,
  QRGenerationResult,
  QRLibraryConfig,
  DOT_STYLE_MAPPING,
  EYE_STYLE_MAPPING,
  GradientConfig,
  QRProcessingError
} from './types';

// ============ PARAMETER MAPPING ============

function mapDotStyle(dotStyle?: string): string {
  if (!dotStyle) return 'square'; // Default
  return DOT_STYLE_MAPPING[dotStyle as keyof typeof DOT_STYLE_MAPPING] || 'square';
}

function mapEyeStyle(eyeStyle?: string): string {
  if (!eyeStyle) return 'square'; // Default
  return EYE_STYLE_MAPPING[eyeStyle as keyof typeof EYE_STYLE_MAPPING] || 'square';
}

function mapGradient(gradient?: GradientConfig, rotation: number = 0) {
  if (!gradient) return undefined;

  return {
    type: gradient.type,
    rotation: gradient.rotation ?? rotation,
    colorStops: gradient.colors.map(stop => ({
      offset: stop.offset,
      color: stop.color
    }))
  };
}

// ============ CONFIGURATION BUILDER ============

function buildQRConfig(params: ValidatedQRParams): QRLibraryConfig {
  const config: QRLibraryConfig = {
    data: params.data,
    width: params.size,
    height: params.size,
    margin: params.margin,
    qrOptions: {
      errorCorrectionLevel: params.error_correction
    },
    dotsOptions: {
      type: mapDotStyle(params.dot_style),
      color: params.color
    },
    backgroundOptions: {
      color: params.background
    }
  };

  // Apply gradient to dots if specified (overrides flat color)
  if (params.gradient) {
    config.dotsOptions.gradient = mapGradient(params.gradient);
    // Remove flat color when gradient is applied
    delete config.dotsOptions.color;
  }

  // Configure corner squares (outer eye pattern)
  if (params.eye_shape || params.eye_color) {
    config.cornersSquareOptions = {
      type: mapEyeStyle(params.eye_shape),
      color: params.eye_color || params.color
    };
  }

  // Configure corner dots (inner eye pattern)
  if (params.eye_inner_shape || params.eye_inner_color) {
    config.cornersDotOptions = {
      type: mapEyeStyle(params.eye_inner_shape),
      color: params.eye_inner_color || params.eye_color || params.color
    };
  }

  return config;
}

// ============ ERROR CORRECTION AUTO-UPGRADE ============

function shouldUpgradeErrorCorrection(params: ValidatedQRParams): { upgrade: boolean; reason?: string } {
  // Logo embedding with non-square dots benefits from higher error correction
  if (params.logo_url && params.dot_style && params.dot_style !== 'square') {
    if (params.error_correction === 'L') {
      return { upgrade: true, reason: 'Logo embedding with styled dots requires higher error correction' };
    }
  }

  // Very small sizes with complex styling might need higher error correction
  if (params.size < 200 && (params.gradient || params.dot_style !== 'square')) {
    if (params.error_correction === 'L') {
      return { upgrade: true, reason: 'Small size with styling requires higher error correction for scannability' };
    }
  }

  return { upgrade: false };
}

function upgradeErrorCorrection(level: string): string {
  const levels = ['L', 'M', 'Q', 'H'];
  const currentIndex = levels.indexOf(level);
  if (currentIndex === -1 || currentIndex === levels.length - 1) {
    return level; // Already at highest or invalid
  }
  return levels[currentIndex + 1];
}

// ============ MAIN RENDER FUNCTION ============

export async function renderStyledQR(params: ValidatedQRParams): Promise<QRGenerationResult> {
  const warnings: string[] = [];

  try {
    // Clone params to avoid mutations
    const renderParams = { ...params };

    // Check if error correction should be upgraded
    const { upgrade, reason } = shouldUpgradeErrorCorrection(renderParams);
    if (upgrade) {
      const originalLevel = renderParams.error_correction;
      renderParams.error_correction = upgradeErrorCorrection(originalLevel) as any;
      warnings.push(`Error correction auto-upgraded from ${originalLevel} to ${renderParams.error_correction}: ${reason}`);
    }

    // Build library configuration
    const config = buildQRConfig(renderParams);

    // Create QR instance (use any type for config due to library type issues)
    const qr = new QRCodeJs(config as any);

    // Generate SVG (type assertion needed due to incorrect TypeScript definitions)
    const svg = (qr as any).qrSVG._element.toString();

    if (!svg || svg.length === 0) {
      throw new QRProcessingError('QR generation failed - empty SVG output', 'QR_GENERATION_FAILED');
    }

    // Validate SVG structure
    if (!svg.includes('<svg') || !svg.includes('</svg>')) {
      throw new QRProcessingError('QR generation failed - malformed SVG output', 'QR_GENERATION_FAILED');
    }

    return {
      svg,
      warnings
    };

  } catch (error) {
    if (error instanceof QRProcessingError) {
      throw error;
    }

    // Wrap library errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new QRProcessingError(
      `QR rendering failed: ${errorMessage}`,
      'QR_RENDERING_FAILED'
    );
  }
}

// ============ SCANNABILITY VALIDATION ============

/**
 * Validates that the generated QR code should be scannable
 * Returns warnings if certain parameters might affect scannability
 */
export function validateScannability(params: ValidatedQRParams): string[] {
  const warnings: string[] = [];

  // Very low size warnings
  if (params.size < 150) {
    warnings.push('Very small QR codes may be difficult to scan. Consider using size 200 or larger.');
  }

  // High complexity with low error correction
  const isComplex = params.gradient || params.dot_style !== 'square' || params.logo_url;
  if (isComplex && params.error_correction === 'L') {
    warnings.push('Complex styling with low error correction may reduce scannability. Consider using error correction M or higher.');
  }

  // Logo size warnings
  if (params.logo_url && params.logo_size > 25) {
    warnings.push('Large logos may interfere with QR code scanning. Consider reducing logo size to 20% or less.');
  }

  // Color contrast warnings
  if (params.color && params.background) {
    // Simple brightness check (not perfect but catches obvious issues)
    const foregroundBrightness = hexToBrightness(params.color);
    const backgroundBrightness = hexToBrightness(params.background);
    const contrast = Math.abs(foregroundBrightness - backgroundBrightness);

    if (contrast < 128) {
      warnings.push('Low color contrast between foreground and background may reduce scannability.');
    }
  }

  // Gradient complexity warnings
  if (params.gradient && params.gradient.colors.length > 3) {
    warnings.push('Complex gradients with many color stops may reduce scannability.');
  }

  return warnings;
}

// Helper function to calculate brightness from hex color
function hexToBrightness(hex: string): number {
  // Remove # if present
  const color = hex.replace('#', '');

  // Parse RGB values
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);

  // Calculate brightness using standard formula
  return (r * 299 + g * 587 + b * 114) / 1000;
}

// ============ CONFIGURATION EXPORT ============

/**
 * Exports the configuration that would be used for rendering (for testing/debugging)
 */
export function getQRConfig(params: ValidatedQRParams): QRLibraryConfig {
  return buildQRConfig(params);
}