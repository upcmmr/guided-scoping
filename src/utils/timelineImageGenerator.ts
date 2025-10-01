// ============================================================================
// TIMELINE IMAGE GENERATOR - Creates downloadable timeline images from project data
// ============================================================================

export interface TimelinePhaseData {
  discovery: number;
  sprints: number;
  sprintsCount: number;
  uat: number;
  postLaunch: number;
  total: number;
}

export interface TimelineImageConfig {
  width?: number;
  height?: number;
  backgroundColor?: string;
  projectName?: string;
  totalBid?: string;
  sprintLength?: number;
}

const DEFAULT_CONFIG: Required<TimelineImageConfig> = {
  width: 1200,
  height: 500, // Starting height, will be adjusted dynamically
  backgroundColor: '#ffffff',
  projectName: 'Project Timeline',
  totalBid: '',
  sprintLength: 10
};

// Phase colors matching the UI
const PHASE_COLORS = {
  discovery: '#3B82F6',    // blue-500
  sprint: '#10B981',       // green-500
  uat: '#F59E0B',         // yellow-500
  postLaunch: '#8B5CF6'   // purple-500
};

const PHASE_LABELS = {
  discovery: 'Discovery',
  sprint: 'Sprint',
  uat: 'UAT',
  postLaunch: 'Post Launch'
};

/**
 * Generates a downloadable timeline image from project timeline data
 */
export const generateTimelineImage = async (
  timelineData: TimelinePhaseData,
  config: TimelineImageConfig = {}
): Promise<Blob> => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not create canvas context');
  }

  // Set canvas dimensions with high DPI support for maximum crispness
  const dpr = Math.max(window.devicePixelRatio || 1, 2); // Force at least 2x for crisp rendering
  canvas.width = finalConfig.width * dpr;
  canvas.height = finalConfig.height * dpr;
  canvas.style.width = `${finalConfig.width}px`;
  canvas.style.height = `${finalConfig.height}px`;
  ctx.scale(dpr, dpr);
  
  // Enable high-quality rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.textRenderingOptimization = 'optimizeQuality';

  // Clear canvas with background color
  ctx.fillStyle = finalConfig.backgroundColor;
  ctx.fillRect(0, 0, finalConfig.width, finalConfig.height);

  // Calculate dynamic layout dimensions based on timeline data
  const padding = 80; // Increased padding for better text spacing
  const timelineY = 60; // Start timeline lower to give more room for week headers
  const timelineWidth = finalConfig.width - (padding * 2);
  
  // Calculate required timeline height based on phases
  const barHeight = 45; // Slightly taller bars for better text visibility
  const barSpacing = 15; // More spacing between bars
  let requiredTimelineHeight = 80; // More base height for week headers
  
  // Add height for each phase that exists
  if (timelineData.discovery > 0) requiredTimelineHeight += barHeight + barSpacing;
  if (timelineData.sprintsCount > 0) requiredTimelineHeight += (timelineData.sprintsCount * (barHeight + barSpacing));
  if (timelineData.uat > 0) requiredTimelineHeight += barHeight + barSpacing;
  if (timelineData.postLaunch > 0) requiredTimelineHeight += barHeight + barSpacing;
  
  // Calculate total required canvas height
  const projectInfoHeight = 150; // Height for phase duration text
  const totalRequiredHeight = timelineY + requiredTimelineHeight + projectInfoHeight;
  
  // Update canvas height if needed
  const actualHeight = Math.max(totalRequiredHeight, finalConfig.height);
  if (totalRequiredHeight > finalConfig.height) {
    canvas.height = actualHeight * dpr;
    canvas.style.height = `${actualHeight}px`;
    // Re-clear canvas with new height
    ctx.scale(dpr, dpr); // Re-apply scaling after height change
    ctx.fillStyle = finalConfig.backgroundColor;
    ctx.fillRect(0, 0, finalConfig.width, actualHeight);
  }
  
  // Draw timeline
  drawTimeline(ctx, timelineData, finalConfig, padding, timelineY, timelineWidth, requiredTimelineHeight);
  
  // Draw project info (phases and durations only)
  drawProjectInfo(ctx, timelineData, finalConfig, padding, timelineY + requiredTimelineHeight + 20);

  // Convert canvas to blob with maximum quality
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to generate image blob'));
      }
    }, 'image/png', 1.0); // Maximum quality PNG
  });
};



/**
 * Draws the main timeline visualization
 */
const drawTimeline = (
  ctx: CanvasRenderingContext2D,
  timelineData: TimelinePhaseData,
  config: Required<TimelineImageConfig>,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  const totalWeeks = Math.ceil(timelineData.total);
  const weekWidth = width / totalWeeks;
  const barHeight = 40;
  const barSpacing = 10;
  
  // Draw week numbers header with better spacing and sizing
  ctx.fillStyle = '#6B7280';
  ctx.font = 'bold 16px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  
  // Only show week numbers if there's enough space (minimum 30px per week)
  const showWeekNumbers = weekWidth >= 30;
  const weekNumberInterval = weekWidth < 50 ? Math.ceil(50 / weekWidth) : 1;
  
  for (let i = 0; i < totalWeeks; i++) {
    const weekX = x + (i * weekWidth) + (weekWidth / 2);
    
    // Show week numbers with appropriate interval
    if (showWeekNumbers && i % weekNumberInterval === 0) {
      ctx.fillText(`W${i + 1}`, weekX, y - 15);
    }
    
    // Draw week separator lines extending through entire timeline
    if (i > 0) {
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + (i * weekWidth), y);
      ctx.lineTo(x + (i * weekWidth), y + height - 80); // Extend to bottom of timeline area
      ctx.stroke();
    }
  }
  
  let currentY = y + 30; // More space from week headers
  let currentWeek = 0;
  
  // Use the updated bar dimensions from the layout calculation
  const actualBarHeight = 45;
  const actualBarSpacing = 15;
  
  // Draw Discovery phase
  if (timelineData.discovery > 0) {
    drawPhaseBar(
      ctx,
      PHASE_LABELS.discovery,
      PHASE_COLORS.discovery,
      x + (currentWeek * weekWidth),
      currentY,
      timelineData.discovery * weekWidth,
      actualBarHeight,
      weekWidth
    );
    currentWeek += timelineData.discovery;
    currentY += actualBarHeight + actualBarSpacing;
  }
  
  // Draw Sprint phases
  if (timelineData.sprintsCount > 0) {
    const sprintWeeks = config.sprintLength / 5; // Convert days to weeks
    for (let i = 0; i < timelineData.sprintsCount; i++) {
      drawPhaseBar(
        ctx,
        `${PHASE_LABELS.sprint} ${i + 1}`,
        PHASE_COLORS.sprint,
        x + (currentWeek * weekWidth),
        currentY,
        sprintWeeks * weekWidth,
        actualBarHeight,
        weekWidth
      );
      currentWeek += sprintWeeks;
      currentY += actualBarHeight + actualBarSpacing;
    }
  }
  
  // Draw UAT phase
  if (timelineData.uat > 0) {
    drawPhaseBar(
      ctx,
      PHASE_LABELS.uat,
      PHASE_COLORS.uat,
      x + (currentWeek * weekWidth),
      currentY,
      timelineData.uat * weekWidth,
      actualBarHeight,
      weekWidth
    );
    currentWeek += timelineData.uat;
    currentY += actualBarHeight + actualBarSpacing;
  }
  
  // Draw Post Launch phase
  if (timelineData.postLaunch > 0) {
    drawPhaseBar(
      ctx,
      PHASE_LABELS.postLaunch,
      PHASE_COLORS.postLaunch,
      x + (currentWeek * weekWidth),
      currentY,
      timelineData.postLaunch * weekWidth,
      actualBarHeight,
      weekWidth
    );
  }
};

/**
 * Draws a rounded rectangle
 */
const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

/**
 * Draws an individual phase bar with rounded edges and adaptive text sizing
 */
const drawPhaseBar = (
  ctx: CanvasRenderingContext2D,
  label: string,
  color: string,
  x: number,
  y: number,
  width: number,
  height: number,
  weekWidth: number
) => {
  const borderRadius = 8; // Slightly larger rounded corners
  
  // Draw bar background with rounded corners
  ctx.fillStyle = color;
  drawRoundedRect(ctx, x, y, width, height, borderRadius);
  ctx.fill();
  
  // Draw bar border with rounded corners
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, x, y, width, height, borderRadius);
  ctx.stroke();
  
  // Adaptive font sizing based on bar width and available space
  let fontSize = 16;
  let fontWeight = 'bold';
  
  // Adjust font size based on available width
  if (width < 100) {
    fontSize = 12;
  } else if (width < 150) {
    fontSize = 14;
  } else if (width < 200) {
    fontSize = 16;
  } else {
    fontSize = 18;
  }
  
  // Further adjust if week width is very small (many weeks)
  if (weekWidth < 25) {
    fontSize = Math.max(10, fontSize - 2);
  }
  
  // Set text properties with high-quality font rendering
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `${fontWeight} ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Check if text fits, if not, truncate or use abbreviation
  const textWidth = ctx.measureText(label).width;
  let displayLabel = label;
  
  if (textWidth > width - 10) { // 10px padding
    // Try abbreviations for common labels
    if (label.includes('Sprint')) {
      displayLabel = label.replace('Sprint', 'S');
    } else if (label === 'Discovery') {
      displayLabel = 'Disc';
    } else if (label === 'Post Launch') {
      displayLabel = 'Launch';
    }
    
    // If still too long, truncate
    const abbrevWidth = ctx.measureText(displayLabel).width;
    if (abbrevWidth > width - 10) {
      // Use smaller font for very narrow bars
      fontSize = Math.max(8, fontSize - 4);
      ctx.font = `${fontWeight} ${fontSize}px system-ui, -apple-system, sans-serif`;
      
      // Try one more time with smaller font
      if (ctx.measureText(displayLabel).width > width - 10) {
        displayLabel = displayLabel.substring(0, Math.floor((width - 10) / (fontSize * 0.6))) + '...';
      }
    }
  }
  
  // Draw the text centered in the bar
  ctx.fillText(displayLabel, x + (width / 2), y + (height / 2));
};



/**
 * Draws project phase durations summary
 */
const drawProjectInfo = (
  ctx: CanvasRenderingContext2D,
  timelineData: TimelinePhaseData,
  config: Required<TimelineImageConfig>,
  x: number,
  y: number
) => {
  ctx.fillStyle = '#374151';
  ctx.font = 'bold 18px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'left';
  
  const info = [
    `Discovery: ${timelineData.discovery} weeks`,
    `Development: ${Math.round(timelineData.sprints)} weeks (${timelineData.sprintsCount} sprints)`,
    `UAT: ${timelineData.uat} weeks`,
    `Post Launch: ${timelineData.postLaunch} weeks`,
    `Total Duration: ${Math.round(timelineData.total)} weeks`
  ];
  
  info.forEach((text, index) => {
    ctx.fillText(text, x, y + (index * 25));
  });
};

/**
 * Creates a safe filename from project name
 */
export const createTimelineFilename = (projectName: string): string => {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const safeName = projectName
    .replace(/[^a-zA-Z0-9\s-_]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 50); // Limit length
  
  return `${safeName}_Timeline_${date}.png`;
};

/**
 * Downloads the generated timeline image
 */
export const downloadTimelineImage = async (
  timelineData: TimelinePhaseData,
  config: TimelineImageConfig = {}
): Promise<void> => {
  try {
    const blob = await generateTimelineImage(timelineData, config);
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = createTimelineFilename(config.projectName || 'Project');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the blob URL
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download timeline image:', error);
    throw error;
  }
};
