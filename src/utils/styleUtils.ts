// ============================================================================
// STYLE UTILITIES - Helper functions for consistent styling
// ============================================================================
// This module provides utility functions for generating consistent CSS classes
// based on the centralized design system configuration in defaults.ts

import { APP_DEFAULTS } from '../config/defaults';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'outline';

/**
 * Generate consistent button classes from design system
 * @param variant - The button variant to use (primary, secondary, success, danger, outline)
 * @returns Complete CSS class string for the button
 * @example
 * ```tsx
 * <button className={getButtonClasses('primary')}>
 *   Save Changes
 * </button>
 * ```
 */
export const getButtonClasses = (variant: ButtonVariant = 'primary'): string => {
  const config = APP_DEFAULTS.ui.designSystem.buttons[variant];
  const classes = [
    'flex items-center',
    config.padding,
    config.bg,
    config.bgHover,
    config.text,
    config.borderRadius,
    config.fontSize,
    config.fontWeight,
    config.shadow,
    config.transition
  ];
  
  // Add border if it exists (only for outline variant)
  if ('border' in config) {
    classes.push(config.border);
  }
  
  return classes.filter(Boolean).join(' ');
};

/**
 * Generate consistent input classes from design system
 * @returns Complete CSS class string for text inputs
 * @example
 * ```tsx
 * <input className={getInputClasses()} />
 * ```
 */
export const getInputClasses = (): string => {
  const config = APP_DEFAULTS.ui.designSystem.forms.input;
  return [
    'w-full',
    config.padding,
    config.border,
    config.borderRadius,
    config.fontSize,
    config.focus
  ].join(' ');
};

/**
 * Generate consistent textarea classes from design system
 * @returns Complete CSS class string for textarea elements
 * @example
 * ```tsx
 * <textarea className={getTextareaClasses()} />
 * ```
 */
export const getTextareaClasses = (): string => {
  const config = APP_DEFAULTS.ui.designSystem.forms.textarea;
  return [
    'w-full',
    config.padding,
    config.border,
    config.borderRadius,
    config.fontSize,
    config.focus,
    config.resize
  ].join(' ');
};

/**
 * Generate consistent label classes from design system
 * @returns Complete CSS class string for form labels
 * @example
 * ```tsx
 * <label className={getLabelClasses()}>Field Name</label>
 * ```
 */
export const getLabelClasses = (): string => {
  const config = APP_DEFAULTS.ui.designSystem.forms.label;
  return [
    'block',
    config.fontSize,
    config.fontWeight,
    config.color,
    config.margin
  ].join(' ');
};

/**
 * Generate consistent card classes from design system
 * @returns Complete CSS class string for card containers
 * @example
 * ```tsx
 * <div className={getCardClasses()}>Card content</div>
 * ```
 */
export const getCardClasses = (): string => {
  const config = APP_DEFAULTS.ui.designSystem.cards.default;
  return [
    config.border,
    config.borderRadius,
    config.shadow,
    'mb-8',
    config.overflow
  ].join(' ');
};

/**
 * Generate consistent card header classes from design system
 * @returns Complete CSS class string for card headers
 * @example
 * ```tsx
 * <div className={getCardHeaderClasses()}>Header content</div>
 * ```
 */
export const getCardHeaderClasses = (): string => {
  const config = APP_DEFAULTS.ui.designSystem.cards.header;
  return [
    config.bg,
    config.text,
    config.padding
  ].join(' ');
};

/**
 * Generate consistent heading classes from design system
 * @param level - The heading level (h1, h2, h3, h4, h5)
 * @returns Complete CSS class string for the specified heading level
 * @example
 * ```tsx
 * <h1 className={getHeadingClasses('h1')}>Main Title</h1>
 * ```
 */
export const getHeadingClasses = (level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5'): string => {
  return APP_DEFAULTS.ui.designSystem.typography.headings[level];
};

/**
 * Generate consistent body text classes from design system
 * @param variant - The text variant (base, small, muted)
 * @returns Complete CSS class string for body text
 * @example
 * ```tsx
 * <p className={getBodyClasses('base')}>Regular text</p>
 * <p className={getBodyClasses('small')}>Small text</p>
 * <p className={getBodyClasses('muted')}>Muted text</p>
 * ```
 */
export const getBodyClasses = (variant: 'base' | 'small' | 'muted' = 'base'): string => {
  return APP_DEFAULTS.ui.designSystem.typography.body[variant];
};

/**
 * Get standardized spacing values for consistent margins
 * @example
 * ```tsx
 * <div className={spacing.section}>Section with standard margin</div>
 * <div className={spacing.field}>Form field with standard margin</div>
 * ```
 */
export const spacing = {
  section: 'mb-8',
  subsection: 'mb-6',
  field: 'mb-4',
  small: 'mb-2'
};

/**
 * Get icon size classes for consistency across all components
 * @example
 * ```tsx
 * <PlusIcon className={iconSizes.small} />
 * <SettingsIcon className={iconSizes.medium} />
 * ```
 */
export const iconSizes = {
  small: 'w-4 h-4',
  medium: 'w-5 h-5',
  large: 'w-6 h-6',
  xl: 'w-8 h-8'
};

/**
 * Generate consistent empty state classes for "no data" displays
 * @returns Complete CSS class string for empty state containers
 * @example
 * ```tsx
 * <div className={getEmptyStateClasses()}>
 *   <p>No items found</p>
 * </div>
 * ```
 */
export const getEmptyStateClasses = (): string => {
  return 'text-center py-12 text-gray-500 rounded-lg border-2 border-dashed border-gray-300';
};

/**
 * Get consistent animation classes for loading states and transitions
 * @example
 * ```tsx
 * <div className={animations.spinner}></div>
 * <button className={animations.transition}>Hover me</button>
 * ```
 */
export const animations = {
  spinner: 'inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600',
  transition: 'transition-colors',
  hover: 'hover:shadow-lg',
  focus: 'focus:outline-none focus:ring-2 focus:ring-blue-500'
};

export default {
  getButtonClasses,
  getInputClasses,
  getTextareaClasses,
  getLabelClasses,
  getCardClasses,
  getCardHeaderClasses,
  getHeadingClasses,
  getBodyClasses,
  spacing,
  iconSizes,
  getEmptyStateClasses,
  animations
}; 