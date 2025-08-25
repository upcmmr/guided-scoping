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
  height: 300, // Starting height, will be adjusted dynamically
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

  // Set canvas dimensions with high DPI support
  const dpr = window.devicePixelRatio || 1;
  canvas.width = finalConfig.width * dpr;
  canvas.height = finalConfig.height * dpr;
  canvas.style.width = `${finalConfig.width}px`;
  canvas.style.height = `${finalConfig.height}px`;
  ctx.scale(dpr, dpr);

  // Clear canvas with background color
  ctx.fillStyle = finalConfig.backgroundColor;
  ctx.fillRect(0, 0, finalConfig.width, finalConfig.height);

  // Calculate dynamic layout dimensions based on timeline data
  const padding = 60;
  const timelineY = 40; // Start timeline near the top
  const timelineWidth = finalConfig.width - (padding * 2);
  
  // Calculate required timeline height based on phases
  const barHeight = 40;
  const barSpacing = 10;
  let requiredTimelineHeight = 60; // Base height for week headers
  
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

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to generate image blob'));
      }
    }, 'image/png', 1.0);
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
  
  // Draw week numbers header
  ctx.fillStyle = '#6B7280';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  
  for (let i = 0; i < totalWeeks; i++) {
    const weekX = x + (i * weekWidth) + (weekWidth / 2);
    ctx.fillText(`W${i + 1}`, weekX, y - 10);
    
    // Draw week separator lines extending through entire timeline
    if (i > 0) {
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + (i * weekWidth), y);
      ctx.lineTo(x + (i * weekWidth), y + height - 60); // Extend to bottom of timeline area
      ctx.stroke();
    }
  }
  
  let currentY = y + 20;
  let currentWeek = 0;
  
  // Draw Discovery phase
  if (timelineData.discovery > 0) {
    drawPhaseBar(
      ctx,
      PHASE_LABELS.discovery,
      PHASE_COLORS.discovery,
      x + (currentWeek * weekWidth),
      currentY,
      timelineData.discovery * weekWidth,
      barHeight
    );
    currentWeek += timelineData.discovery;
    currentY += barHeight + barSpacing;
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
        barHeight
      );
      currentWeek += sprintWeeks;
      currentY += barHeight + barSpacing;
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
      barHeight
    );
    currentWeek += timelineData.uat;
    currentY += barHeight + barSpacing;
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
      barHeight
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
 * Draws an individual phase bar with rounded edges
 */
const drawPhaseBar = (
  ctx: CanvasRenderingContext2D,
  label: string,
  color: string,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  const borderRadius = 6; // Rounded corner radius
  
  // Draw bar background with rounded corners
  ctx.fillStyle = color;
  drawRoundedRect(ctx, x, y, width, height, borderRadius);
  ctx.fill();
  
  // Draw bar border with rounded corners
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, x, y, width, height, borderRadius);
  ctx.stroke();
  
  // Draw label
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + (width / 2), y + (height / 2) + 5);
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
  ctx.font = '16px system-ui, -apple-system, sans-serif';
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
