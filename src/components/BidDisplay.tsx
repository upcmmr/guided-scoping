import React from 'react';
import rolesAndRates from '../config/roles-and-rates.json';
import APP_DEFAULTS from '../config/defaults';

interface BidDisplayProps {
  projectData?: any;
  templateData?: any;
  selectedTeamModel?: 'profile1' | 'profile2' | 'profile3' | null;
  scopeSelections?: Map<string, boolean>;
  onClose?: () => void;
}

const BidDisplay: React.FC<BidDisplayProps> = ({
  projectData,
  templateData,
  selectedTeamModel,
  scopeSelections,
  onClose
}) => {
  // Utility function to get business days per week
  const getBusinessDaysPerWeek = () => 5; // Standard business week

  // Utility function to get hours per week
  const getHoursPerWeek = () => APP_DEFAULTS.sprintPlanning.hoursPerDay * getBusinessDaysPerWeek();

  // Function to get rate for a role from the JSON data
  const getRateForRole = (roleName: string, region: string = 'USA') => {
    const roleData = rolesAndRates.roles.find(role => 
      role.roleName.toLowerCase() === roleName.toLowerCase() && 
      role.region === region
    );
    
    if (!roleData) {
      console.warn(`No rate found for role: ${roleName} in region: ${region}`);
      return 0; // Return 0 instead of hardcoded fallback
    }
    
    return roleData.billRate;
  };

  // Calculate project duration in weeks
  const calculateProjectDuration = () => {
    if (!projectData) return { discovery: 0, sprints: 0, uat: 0, postLaunch: 0, total: 0 };

    const timelineSections = projectData.timelineSections || {};
    const sprintLength = projectData.sprintSections?.sprintLength || APP_DEFAULTS.sprint.length;
    
    // Get timeline values - they can be numbers or objects with profile values
    const getTimelineValue = (section: any) => {
      if (!section) return 0;
      if (typeof section === 'number') return section;
      if (selectedTeamModel && section[selectedTeamModel]) {
        return section[selectedTeamModel];
      }
      return 0;
    };

    const discovery = getTimelineValue(timelineSections.discovery);
    const uat = getTimelineValue(timelineSections.uat);
    const postLaunch = getTimelineValue(timelineSections.postLaunch);

    // Calculate sprint count and duration (matching main app logic exactly)
    const totalScopeHours = calculateTotalScopeHours();
    const teamCapacityPerSprint = calculateTeamCapacityPerSprint();
    
    // Match main app's calculateSprints logic
    let sprintsNeeded = 0;
    if (totalScopeHours > 0 && teamCapacityPerSprint > 0) {
      sprintsNeeded = Math.ceil(totalScopeHours / teamCapacityPerSprint);
    }
    
    const sprintDurationWeeks = (sprintsNeeded * sprintLength) / getBusinessDaysPerWeek();

    const total = discovery + sprintDurationWeeks + uat + postLaunch;

    return {
      discovery,
      sprints: sprintDurationWeeks,
      sprintsCount: sprintsNeeded,
      uat,
      postLaunch,
      total
    };
  };

  // Calculate total scope hours from selected items
  const calculateTotalScopeHours = () => {
    if (!projectData || !scopeSelections) return 0;

    let totalHours = 0;
    projectData.scopeSections?.forEach((section: any, sectionIndex: number) => {
      section.items?.forEach((item: any, itemIndex: number) => {
        const key = `${sectionIndex}-${itemIndex}`;
        if (scopeSelections.get(key)) {
          totalHours += item.hours || APP_DEFAULTS.scopeItem.fallbackHours;
        }
      });
    });

    return totalHours;
  };

  // Calculate team capacity per sprint (matching main app logic)
  const calculateTeamCapacityPerSprint = () => {
    if (!projectData) return 0;

    const sprintLength = projectData.sprintSections?.sprintLength || APP_DEFAULTS.sprint.length;
    const efficiency = (projectData.sprintSections?.sprintEfficiency || APP_DEFAULTS.sprint.efficiency) / APP_DEFAULTS.sprintPlanning.percentageConversion;
    const hoursPerDay = APP_DEFAULTS.sprintPlanning.hoursPerDay;

    // Get developer count based on selected team model (matching main app)
    let developerCount = 0;
    if (selectedTeamModel === 'profile1') {
      developerCount = projectData.teamSections?.minDevelopers || APP_DEFAULTS.developers.min;
    } else if (selectedTeamModel === 'profile2') {
      developerCount = projectData.teamSections?.standardDevelopers || APP_DEFAULTS.developers.standard;
    } else if (selectedTeamModel === 'profile3') {
      developerCount = projectData.teamSections?.maxDevelopers || APP_DEFAULTS.developers.max;
    }

    return developerCount * sprintLength * hoursPerDay * efficiency;
  };

    // Calculate team composition and costs grouped by region
  const calculateTeamCosts = () => {
    if (!projectData || !selectedTeamModel) return { breakdown: [], totalWeeklyCost: 0 };

    const duration = calculateProjectDuration();
    const regionGroups: { [key: string]: any[] } = {};
    let totalWeeklyCost = 0;

    // Add configured team roles from team sections
    projectData.teamSections?.resourceSections?.forEach((section: any) => {
      section.roles?.forEach((role: any) => {
        const count = role[selectedTeamModel] || 0;
        if (count > 0) {
          // Determine region based on section name or explicit region
          let sectionRegion = section.region;
          if (!sectionRegion) {
            // Infer region from section name
            if (section.name.toLowerCase().includes('offshore') || section.name.toLowerCase().includes('gdc')) {
              sectionRegion = 'GDC';
            } else if (section.name.toLowerCase().includes('onshore') || section.name.toLowerCase().includes('usa')) {
              sectionRegion = 'USA';
            } else {
              sectionRegion = 'USA'; // Default fallback
            }
          }
          const rate = getRateForRole(role.name, sectionRegion);

          const hoursPerWeek = getHoursPerWeek();
          const weeklyCost = count * hoursPerWeek * rate;
          const totalCost = weeklyCost * duration.total;
          const totalHours = count * hoursPerWeek * duration.total;

          if (!regionGroups[sectionRegion]) {
            regionGroups[sectionRegion] = [];
          }

          regionGroups[sectionRegion].push({
            role: role.name,
            count,
            rate,
            hoursPerWeek,
            weeklyCost,
            totalCost,
            totalHours,
            region: sectionRegion
          });

          totalWeeklyCost += weeklyCost;
        }
      });
    });

    // Add developers and QA consultants based on sprint configuration
    const addSprintBasedRoles = (region: string) => {
      // Get developer count from team sections based on selected profile
      let developerCount = 0;
      if (selectedTeamModel === 'profile1') {
        developerCount = projectData.teamSections?.minDevelopers || APP_DEFAULTS.developers.min;
      } else if (selectedTeamModel === 'profile2') {
        developerCount = projectData.teamSections?.standardDevelopers || APP_DEFAULTS.developers.standard;
      } else if (selectedTeamModel === 'profile3') {
        developerCount = projectData.teamSections?.maxDevelopers || APP_DEFAULTS.developers.max;
      }

      // Calculate QA consultants based on QA team factor
      let qaFactor = 0;
      if (selectedTeamModel === 'profile1') {
        qaFactor = projectData.teamSections?.minQaTeamFactor || APP_DEFAULTS.qa.minTeamFactor;
      } else if (selectedTeamModel === 'profile2') {
        qaFactor = projectData.teamSections?.standardQaTeamFactor || APP_DEFAULTS.qa.standardTeamFactor;
      } else if (selectedTeamModel === 'profile3') {
        qaFactor = projectData.teamSections?.maxQaTeamFactor || APP_DEFAULTS.qa.maxTeamFactor;
      }

      const qaCount = Math.ceil((developerCount * qaFactor) / 100);

      if (!regionGroups[region]) {
        regionGroups[region] = [];
      }

      // Add developers
      if (developerCount > 0) {
        const devRate = getRateForRole('Developer', region);
        const hoursPerWeek = getHoursPerWeek();
        const devWeeklyCost = developerCount * hoursPerWeek * devRate;
        const devTotalCost = devWeeklyCost * duration.total;
        const devTotalHours = developerCount * hoursPerWeek * duration.total;

        regionGroups[region].push({
          role: 'Developer',
          count: developerCount,
          rate: devRate,
          hoursPerWeek,
          weeklyCost: devWeeklyCost,
          totalCost: devTotalCost,
          totalHours: devTotalHours,
          region: region
        });

        totalWeeklyCost += devWeeklyCost;
      }

      // Add QA consultants
      if (qaCount > 0) {
        const qaRate = getRateForRole('QA Consultant', region);
        const hoursPerWeek = getHoursPerWeek();
        const qaWeeklyCost = qaCount * hoursPerWeek * qaRate;
        const qaTotalCost = qaWeeklyCost * duration.total;
        const qaTotalHours = qaCount * hoursPerWeek * duration.total;

        regionGroups[region].push({
          role: 'QA Consultant',
          count: qaCount,
          rate: qaRate,
          hoursPerWeek,
          weeklyCost: qaWeeklyCost,
          totalCost: qaTotalCost,
          totalHours: qaTotalHours,
          region: region
        });

        totalWeeklyCost += qaWeeklyCost;
      }
    };

    // Add sprint-based roles for both regions (assuming they could be in either)
    addSprintBasedRoles('GDC'); // Typically developers would be offshore
    // You can also add USA developers if needed: addSprintBasedRoles('USA');

    return { breakdown: regionGroups, totalWeeklyCost };
  };

  // Calculate final bid price
  const calculateBidPrice = () => {
    const duration = calculateProjectDuration();
    const teamCosts = calculateTeamCosts();
    
    const baseCost = teamCosts.totalWeeklyCost * duration.total;
    
    return {
      baseCost,
      totalBid: baseCost,
      duration,
      teamCosts
    };
  };

  const bidCalculation = calculateBidPrice();
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);

  return (
    <div className="w-full max-h-[70vh] overflow-y-auto">


                  {/* Project Timeline Gantt Chart */}
      <div className="mb-6 p-6 bg-white border-2 border-gray-200 rounded-lg shadow-sm">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Project Timeline</h4>
        
        {(() => {
          // Calculate responsive width per week to fit full modal width
          const totalWeeks = Math.ceil(bidCalculation.duration.total);
          // Use CSS calc to determine available width dynamically
          const weekWidthPercent = 100 / totalWeeks; // Each week gets equal percentage of available width
          
          return (
            <>
              {/* Week Numbers Header */}
              <div className="mb-4">
                <div className="flex w-full">
                  {Array.from({ length: totalWeeks }, (_, i) => (
                    <div key={i} className="text-center text-xs text-gray-600 font-medium border-r border-gray-200 flex-1">
                      W{i + 1}
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline Bars - Cascading */}
              <div className="space-y-2">
                
                {/* Discovery Phase */}
                {bidCalculation.duration.discovery > 0 && (
                  <div className="relative w-full" style={{ height: '40px' }}>
                    <div 
                      className="bg-blue-500 text-white text-xs px-2 py-3 rounded shadow-sm flex items-center justify-center absolute font-medium"
                      style={{ 
                        width: `${(bidCalculation.duration.discovery / totalWeeks) * 100}%`,
                        left: '0%',
                        height: '40px'
                      }}
                    >
                      Discovery
                    </div>
                  </div>
                )}

                {/* Development Sprints - Cascading */}
                {Array.from({ length: bidCalculation.duration.sprintsCount || 0 }, (_, i) => {
                  const sprintLength = (projectData?.sprintSections?.sprintLength || APP_DEFAULTS.sprint.length) / getBusinessDaysPerWeek();
                  const sprintStartWeek = bidCalculation.duration.discovery + (i * sprintLength);
                  return (
                    <div key={i} className="relative w-full" style={{ height: '40px' }}>
                      <div 
                        className="bg-green-500 text-white text-xs px-2 py-3 rounded shadow-sm flex items-center justify-center absolute font-medium"
                        style={{ 
                          width: `${(sprintLength / totalWeeks) * 100}%`,
                          left: `${(sprintStartWeek / totalWeeks) * 100}%`,
                          height: '40px'
                        }}
                      >
                        Sprint {i + 1}
                      </div>
                    </div>
                  );
                })}

                {/* UAT Phase */}
                {bidCalculation.duration.uat > 0 && (
                  <div className="relative w-full" style={{ height: '40px' }}>
                    <div 
                      className="bg-yellow-500 text-white text-xs px-2 py-3 rounded shadow-sm flex items-center justify-center absolute font-medium"
                      style={{ 
                        width: `${(bidCalculation.duration.uat / totalWeeks) * 100}%`,
                        left: `${((bidCalculation.duration.discovery + bidCalculation.duration.sprints) / totalWeeks) * 100}%`,
                        height: '40px'
                      }}
                    >
                      UAT
                    </div>
                  </div>
                )}

                {/* Post Launch Phase */}
                {bidCalculation.duration.postLaunch > 0 && (
                  <div className="relative w-full" style={{ height: '40px' }}>
                    <div 
                      className="bg-purple-500 text-white text-xs px-2 py-3 rounded shadow-sm flex items-center justify-center absolute font-medium"
                      style={{ 
                        width: `${(bidCalculation.duration.postLaunch / totalWeeks) * 100}%`,
                        left: `${((bidCalculation.duration.discovery + bidCalculation.duration.sprints + bidCalculation.duration.uat) / totalWeeks) * 100}%`,
                        height: '40px'
                      }}
                    >
                      Post Launch
                    </div>
                  </div>
                )}

              </div>
            </>
          );
        })()}

        {/* Timeline Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
            <span className="text-gray-600">Discovery</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
            <span className="text-gray-600">Development Sprints</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded mr-1"></div>
            <span className="text-gray-600">UAT</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded mr-1"></div>
            <span className="text-gray-600">Post Launch</span>
          </div>
        </div>
      </div>

      {/* Project Duration */}
      <div className="mb-6 p-6 bg-white border-2 border-gray-200 rounded-lg shadow-sm">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Project Duration</h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Discovery:</span>
            <span className="font-medium text-gray-800">{bidCalculation.duration.discovery} weeks</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Development:</span>
            <span className="font-medium text-gray-800">{Math.round(bidCalculation.duration.sprints)} weeks</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">UAT:</span>
            <span className="font-medium text-gray-800">{bidCalculation.duration.uat} weeks</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Post Launch:</span>
            <span className="font-medium text-gray-800">{bidCalculation.duration.postLaunch} weeks</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-gray-200">
            <span className="font-semibold text-gray-800">Total Duration:</span>
            <span className="font-medium text-gray-800">{Math.round(bidCalculation.duration.total)} weeks</span>
          </div>
        </div>
      </div>

      {/* Team Resource Breakdown */}
      <div className="mb-6 p-6 bg-white border-2 border-gray-200 rounded-lg shadow-sm">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Team Resource Costs</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-3 text-gray-600 font-medium w-1/3">Role</th>
                <th className="text-center p-3 text-gray-600 font-medium w-1/12">Count</th>
                <th className="text-right p-3 text-gray-600 font-medium w-1/6">Total Hours</th>
                <th className="text-right p-3 text-gray-600 font-medium w-1/6">Rate/Hr</th>
                <th className="text-right p-3 text-gray-600 font-medium w-1/4">Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(bidCalculation.teamCosts.breakdown).map(([region, roles]) => (
                <React.Fragment key={region}>
                  <tr className="bg-gray-100">
                    <td colSpan={5} className="p-3 font-semibold text-gray-800 border-b border-gray-200">
                      {region}
                    </td>
                  </tr>
                  {roles.map((item, index) => (
                    <tr key={`${region}-${index}`} className="border-b border-gray-200">
                      <td className="p-3">
                        <div className="font-medium text-gray-800">{item.role}</div>
                      </td>
                      <td className="text-center p-3 text-gray-800">{item.count}</td>
                      <td className="text-right p-3 text-gray-800">{item.totalHours.toLocaleString()}</td>
                      <td className="text-right p-3 text-gray-800">{formatCurrency(item.rate)}</td>
                      <td className="text-right p-3 font-semibold text-gray-800">{formatCurrency(item.totalCost)}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
              <tr className="border-t-2 border-gray-800 bg-blue-50">
                <td colSpan={4} className="p-4 font-bold text-gray-800 text-lg">
                  Total Project Bid
                </td>
                <td className="text-right p-4 font-bold text-gray-800 text-xl">
                  {formatCurrency(bidCalculation.totalBid)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>




    </div>
  );
};

export default BidDisplay; 