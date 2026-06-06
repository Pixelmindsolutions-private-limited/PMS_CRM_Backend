// const Worksheet = require('../models/Worksheet');
// const { Staff } = require('../models/Staff');

// // ==================== CREATE WORKSHEET ====================
// // @desc    Create new worksheet
// // @route   POST /api/worksheets
// const createWorksheet = async (req, res) => {
//   try {
//     console.log("📝 Creating new worksheet");
//     console.log("req.body:", req.body);
    
//     const { empId, employName, sheet, projects } = req.body;

//     // Validate required fields
//     if (!empId || !employName || !sheet) {
//       return res.status(400).json({
//         success: false,
//         message: 'Employee ID, name, and sheet type are required'
//       });
//     }

//     if (!projects || projects.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'At least one project assignment is required'
//       });
//     }

//     // Validate each project
//     for (const project of projects) {
//       if (!project.projectName || !project.startDate || !project.endDate || !project.hours) {
//         return res.status(400).json({
//           success: false,
//           message: 'Each project must have name, start date, end date, and hours'
//         });
//       }
      
//       // Check if end date is after start date
//       if (new Date(project.endDate) < new Date(project.startDate)) {
//         return res.status(400).json({
//           success: false,
//           message: `End date must be after start date for project: ${project.projectName}`
//         });
//       }
//     }

//     const worksheet = new Worksheet({
//       empId,
//       employName,
//       sheet,
//       projects
//     });

//     await worksheet.save();

//     res.status(201).json({
//       success: true,
//       message: 'Worksheet created successfully',
//       data: worksheet
//     });
//   } catch (error) {
//     console.error('Create worksheet error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message || 'Server error while creating worksheet'
//     });
//   }
// };

// // ==================== GET ALL WORKSHEETS ====================
// // @desc    Get all worksheets with pagination and filters
// // @route   GET /api/worksheets
// const getAllWorksheets = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, search, sheet, project } = req.query;
//     const query = {};

//     // Search by employee ID or name
//     if (search) {
//       query.$or = [
//         { empId: { $regex: search, $options: 'i' } },
//         { employName: { $regex: search, $options: 'i' } }
//       ];
//     }

//     // Filter by sheet type
//     if (sheet) {
//       query.sheet = sheet;
//     }

//     // Filter by project name
//     if (project) {
//       query['projects.projectName'] = { $regex: project, $options: 'i' };
//     }

//     const total = await Worksheet.countDocuments(query);
//     const worksheets = await Worksheet.find(query)
//       .limit(parseInt(limit))
//       .skip((parseInt(page) - 1) * parseInt(limit))
//       .sort({ createdAt: -1 });

//     res.json({
//       success: true,
//       data: worksheets,
//       pagination: {
//         total,
//         page: parseInt(page),
//         limit: parseInt(limit),
//         pages: Math.ceil(total / parseInt(limit))
//       }
//     });
//   } catch (error) {
//     console.error('Get worksheets error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // ==================== GET WORKSHEET BY ID ====================
// // @desc    Get worksheet by ID
// // @route   GET /api/worksheets/:id
// const getWorksheetById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const worksheet = await Worksheet.findById(id);

//     if (!worksheet) {
//       return res.status(404).json({
//         success: false,
//         message: 'Worksheet not found'
//       });
//     }

//     res.json({
//       success: true,
//       data: worksheet
//     });
//   } catch (error) {
//     console.error('Get worksheet error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // ==================== UPDATE WORKSHEET ====================
// // @desc    Update worksheet
// // @route   PUT /api/worksheets/:id
// const updateWorksheet = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updateData = req.body;

//     const worksheet = await Worksheet.findById(id);
//     if (!worksheet) {
//       return res.status(404).json({
//         success: false,
//         message: 'Worksheet not found'
//       });
//     }

//     // Validate projects if present
//     if (updateData.projects && updateData.projects.length > 0) {
//       for (const project of updateData.projects) {
//         if (project.projectName && (!project.startDate || !project.endDate || !project.hours)) {
//           return res.status(400).json({
//             success: false,
//             message: 'Each project must have name, start date, end date, and hours'
//           });
//         }
        
//         if (project.startDate && project.endDate && new Date(project.endDate) < new Date(project.startDate)) {
//           return res.status(400).json({
//             success: false,
//             message: `End date must be after start date for project: ${project.projectName}`
//           });
//         }
//       }
//     }

//     // Remove fields that shouldn't be updated
//     delete updateData._id;
//     delete updateData.createdAt;

//     const updatedWorksheet = await Worksheet.findByIdAndUpdate(
//       id,
//       updateData,
//       { new: true, runValidators: true }
//     );

//     res.json({
//       success: true,
//       message: 'Worksheet updated successfully',
//       data: updatedWorksheet
//     });
//   } catch (error) {
//     console.error('Update worksheet error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // ==================== DELETE WORKSHEET ====================
// // @desc    Delete worksheet
// // @route   DELETE /api/worksheets/:id
// const deleteWorksheet = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const worksheet = await Worksheet.findByIdAndDelete(id);

//     if (!worksheet) {
//       return res.status(404).json({
//         success: false,
//         message: 'Worksheet not found'
//       });
//     }

//     res.json({
//       success: true,
//       message: 'Worksheet deleted successfully'
//     });
//   } catch (error) {
//     console.error('Delete worksheet error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // ==================== STAFF OPTIONS ====================
// // @desc    Get staff options for dropdown (active staff only)
// // @route   GET /api/worksheets/staff-options
// const getStaffOptions = async (req, res) => {
//   try {
//     const staff = await Staff.find({ isActive: true })
//       .select('employeeId employeeName')
//       .sort({ employeeName: 1 });

//     const options = staff.map(s => ({
//       id: s._id,
//       staffId: s.employeeId,
//       staffName: s.employeeName
//     }));

//     res.json({
//       success: true,
//       data: options
//     });
//   } catch (error) {
//     console.error('Get staff options error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // ==================== PROJECT OPTIONS ====================
// // @desc    Get unique project names from existing worksheets
// // @route   GET /api/worksheets/project-options
// const getProjectOptions = async (req, res) => {
//   try {
//     const projects = await Worksheet.aggregate([
//       { $unwind: '$projects' },
//       { $group: { _id: '$projects.projectName' } },
//       { $sort: { _id: 1 } }
//     ]);

//     const options = projects.map(p => ({
//       id: p._id,
//       projectName: p._id
//     }));

//     res.json({
//       success: true,
//       data: options
//     });
//   } catch (error) {
//     console.error('Get project options error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // ==================== GET WORKSHEETS BY EMPLOYEE ====================
// // @desc    Get all worksheets for a specific employee
// // @route   GET /api/worksheets/employee/:empId
// const getWorksheetsByEmployee = async (req, res) => {
//   try {
//     const { empId } = req.params;
//     const { page = 1, limit = 10 } = req.query;

//     const query = { empId: { $regex: empId, $options: 'i' } };
//     const total = await Worksheet.countDocuments(query);
//     const worksheets = await Worksheet.find(query)
//       .limit(parseInt(limit))
//       .skip((parseInt(page) - 1) * parseInt(limit))
//       .sort({ createdAt: -1 });

//     if (!worksheets || worksheets.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: `No worksheets found for employee ID: ${empId}`
//       });
//     }

//     res.json({
//       success: true,
//       data: worksheets,
//       pagination: {
//         total,
//         page: parseInt(page),
//         limit: parseInt(limit),
//         pages: Math.ceil(total / parseInt(limit))
//       }
//     });
//   } catch (error) {
//     console.error('Get worksheets by employee error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // ==================== GET WORKSHEETS BY PROJECT ====================
// // @desc    Get all worksheets containing a specific project
// // @route   GET /api/worksheets/project/:projectName
// const getWorksheetsByProject = async (req, res) => {
//   try {
//     const { projectName } = req.params;
//     const { page = 1, limit = 10 } = req.query;

//     const query = { 'projects.projectName': { $regex: projectName, $options: 'i' } };
//     const total = await Worksheet.countDocuments(query);
//     const worksheets = await Worksheet.find(query)
//       .limit(parseInt(limit))
//       .skip((parseInt(page) - 1) * parseInt(limit))
//       .sort({ createdAt: -1 });

//     if (!worksheets || worksheets.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: `No worksheets found for project: ${projectName}`
//       });
//     }

//     res.json({
//       success: true,
//       data: worksheets,
//       pagination: {
//         total,
//         page: parseInt(page),
//         limit: parseInt(limit),
//         pages: Math.ceil(total / parseInt(limit))
//       }
//     });
//   } catch (error) {
//     console.error('Get worksheets by project error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // ==================== GET WORKSHEET STATISTICS ====================
// // @desc    Get worksheet statistics
// // @route   GET /api/worksheets/stats
// const getWorksheetStats = async (req, res) => {
//   try {
//     // Total worksheets
//     const totalWorksheets = await Worksheet.countDocuments();
    
//     // Worksheets by sheet type
//     const sheetStats = await Worksheet.aggregate([
//       { $group: { _id: '$sheet', count: { $sum: 1 } } },
//       { $sort: { count: -1 } }
//     ]);
    
//     // Total projects assigned
//     const totalProjects = await Worksheet.aggregate([
//       { $project: { projectCount: { $size: '$projects' } } },
//       { $group: { _id: null, total: { $sum: '$projectCount' } } }
//     ]);
    
//     // Total hours across all projects
//     const totalHours = await Worksheet.aggregate([
//       { $unwind: '$projects' },
//       { $group: { _id: null, totalHours: { $sum: '$projects.hours' } } }
//     ]);
    
//     // Active employees (unique employees with worksheets)
//     const activeEmployees = await Worksheet.distinct('empId');
    
//     // Recent worksheets (last 30 days)
//     const thirtyDaysAgo = new Date();
//     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
//     const recentWorksheets = await Worksheet.countDocuments({
//       createdAt: { $gte: thirtyDaysAgo }
//     });
    
//     // Worksheets by status (based on date ranges)
//     const today = new Date();
//     const activeProjects = await Worksheet.aggregate([
//       { $unwind: '$projects' },
//       { 
//         $match: { 
//           'projects.endDate': { $gte: today }
//         } 
//       },
//       { $group: { _id: null, count: { $sum: 1 } } }
//     ]);
    
//     // Upcoming deadlines (projects ending in next 7 days)
//     const nextWeek = new Date();
//     nextWeek.setDate(nextWeek.getDate() + 7);
//     const upcomingDeadlines = await Worksheet.aggregate([
//       { $unwind: '$projects' },
//       { 
//         $match: { 
//           'projects.endDate': { $gte: today, $lte: nextWeek }
//         } 
//       },
//       { $group: { _id: null, count: { $sum: 1 } } }
//     ]);
    
//     res.json({
//       success: true,
//       data: {
//         totalWorksheets,
//         sheetStats,
//         totalProjects: totalProjects[0]?.total || 0,
//         totalHours: totalHours[0]?.totalHours || 0,
//         activeEmployees: activeEmployees.length,
//         recentWorksheets,
//         activeProjects: activeProjects[0]?.count || 0,
//         upcomingDeadlines: upcomingDeadlines[0]?.count || 0
//       }
//     });
//   } catch (error) {
//     console.error('Get worksheet stats error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // ==================== EXPORT WORKSHEETS ====================
// // @desc    Export worksheets within date range
// // @route   POST /api/worksheets/export
// const exportWorksheets = async (req, res) => {
//   try {
//     const { startDate, endDate } = req.body;

//     if (!startDate || !endDate) {
//       return res.status(400).json({
//         success: false,
//         message: 'Start date and end date are required'
//       });
//     }

//     const start = new Date(startDate);
//     const end = new Date(endDate);
//     end.setHours(23, 59, 59, 999);

//     const worksheets = await Worksheet.find({
//       'projects.startDate': { $lte: end },
//       'projects.endDate': { $gte: start }
//     });

//     const exportData = [];
//     worksheets.forEach(worksheet => {
//       worksheet.projects.forEach(project => {
//         const projectStart = new Date(project.startDate);
//         const projectEnd = new Date(project.endDate);
        
//         if (projectStart <= end && projectEnd >= start) {
//           exportData.push({
//             EmployeeID: worksheet.empId,
//             Name: worksheet.employName,
//             Sheet: worksheet.sheet,
//             Project: project.projectName,
//             Start: project.startDate,
//             End: project.endDate,
//             Hours: project.hours,
//             Shift: project.shift,
//             Comment: project.comment || ''
//           });
//         }
//       });
//     });

//     res.json({
//       success: true,
//       data: exportData,
//       count: exportData.length
//     });
//   } catch (error) {
//     console.error('Export error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // ==================== GET TODAY'S WORKSHEETS FOR EMPLOYEE ====================
// // @desc    Get today's worksheets for a specific employee
// // @route   GET /api/worksheets/employee/:empId/today
// const getEmployeeTodayWorksheets = async (req, res) => {
//   try {
//     const { empId } = req.params;
    
//     // Get today's date (start of day to end of day)
//     const today = new Date();
//     const startOfDay = new Date(today.setHours(0, 0, 0, 0));
//     const endOfDay = new Date(today.setHours(23, 59, 59, 999));

//     // Find worksheets for the employee where any project includes today's date
//     const query = {
//       empId: { $regex: empId, $options: 'i' },
//       'projects': {
//         $elemMatch: {
//           startDate: { $lte: endOfDay },
//           endDate: { $gte: startOfDay }
//         }
//       }
//     };

//     const worksheets = await Worksheet.find(query);

//     if (!worksheets || worksheets.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: `No worksheets found for employee ID: ${empId} for today`,
//         data: []
//       });
//     }

//     // Filter and format only the projects that are active today
//     const todayWorksheets = worksheets.map(worksheet => {
//       const activeProjects = worksheet.projects.filter(project => {
//         const projectStart = new Date(project.startDate);
//         const projectEnd = new Date(project.endDate);
//         return projectStart <= endOfDay && projectEnd >= startOfDay;
//       });

//       return {
//         worksheetId: worksheet._id,
//         empId: worksheet.empId,
//         employName: worksheet.employName,
//         sheet: worksheet.sheet,
//         date: startOfDay,
//         projects: activeProjects.map(project => ({
//           projectName: project.projectName,
//           hours: project.hours,
//           shift: project.shift,
//           comment: project.comment,
//           startDate: project.startDate,
//           endDate: project.endDate
//         }))
//       };
//     });

//     // Calculate total hours for today
//     const totalHoursToday = todayWorksheets.reduce((total, worksheet) => {
//       const worksheetHours = worksheet.projects.reduce((sum, project) => sum + project.hours, 0);
//       return total + worksheetHours;
//     }, 0);

//     res.json({
//       success: true,
//       data: {
//         employee: {
//           empId: empId,
//           name: todayWorksheets[0]?.employName || 'Unknown'
//         },
//         date: startOfDay,
//         worksheets: todayWorksheets,
//         summary: {
//           totalProjects: todayWorksheets.reduce((sum, w) => sum + w.projects.length, 0),
//           totalHours: totalHoursToday,
//           sheetsCount: todayWorksheets.length
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Get employee today worksheets error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // ==================== GET TODAY'S WORKSHEETS FOR ALL EMPLOYEES ====================
// // @desc    Get today's worksheets for all employees
// // @route   GET /api/worksheets/today/all
// const getAllTodayWorksheets = async (req, res) => {
//   try {
//     // Get today's date range
//     const today = new Date();
//     const startOfDay = new Date(today.setHours(0, 0, 0, 0));
//     const endOfDay = new Date(today.setHours(23, 59, 59, 999));

//     // Find all worksheets with projects active today
//     const query = {
//       'projects': {
//         $elemMatch: {
//           startDate: { $lte: endOfDay },
//           endDate: { $gte: startOfDay }
//         }
//       }
//     };

//     const worksheets = await Worksheet.find(query).sort({ employName: 1 });

//     if (!worksheets || worksheets.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'No worksheets found for today',
//         data: []
//       });
//     }

//     // Process each worksheet to include only today's active projects
//     const todayWorksheets = worksheets.map(worksheet => {
//       const activeProjects = worksheet.projects.filter(project => {
//         const projectStart = new Date(project.startDate);
//         const projectEnd = new Date(project.endDate);
//         return projectStart <= endOfDay && projectEnd >= startOfDay;
//       });

//       return {
//         worksheetId: worksheet._id,
//         empId: worksheet.empId,
//         employName: worksheet.employName,
//         sheet: worksheet.sheet,
//         projects: activeProjects.map(project => ({
//           projectName: project.projectName,
//           hours: project.hours,
//           shift: project.shift,
//           comment: project.comment,
//           startDate: project.startDate,
//           endDate: project.endDate
//         }))
//       };
//     }).filter(worksheet => worksheet.projects.length > 0);

//     // Calculate summary statistics
//     const totalEmployees = todayWorksheets.length;
//     const totalProjects = todayWorksheets.reduce((sum, w) => sum + w.projects.length, 0);
//     const totalHours = todayWorksheets.reduce((total, worksheet) => {
//       const worksheetHours = worksheet.projects.reduce((sum, project) => sum + project.hours, 0);
//       return total + worksheetHours;
//     }, 0);

//     // Group by sheet type
//     const sheetBreakdown = {};
//     todayWorksheets.forEach(worksheet => {
//       if (!sheetBreakdown[worksheet.sheet]) {
//         sheetBreakdown[worksheet.sheet] = {
//           employees: 0,
//           projects: 0,
//           hours: 0
//         };
//       }
//       sheetBreakdown[worksheet.sheet].employees++;
//       sheetBreakdown[worksheet.sheet].projects += worksheet.projects.length;
//       sheetBreakdown[worksheet.sheet].hours += worksheet.projects.reduce((sum, p) => sum + p.hours, 0);
//     });

//     // Group by shift
//     const shiftBreakdown = {
//       morning: { employees: 0, projects: 0, hours: 0 },
//       afternoon: { employees: 0, projects: 0, hours: 0 },
//       fullday: { employees: 0, projects: 0, hours: 0 }
//     };
    
//     todayWorksheets.forEach(worksheet => {
//       worksheet.projects.forEach(project => {
//         const shift = project.shift;
//         if (!shiftBreakdown[shift]) {
//           shiftBreakdown[shift] = { employees: 0, projects: 0, hours: 0 };
//         }
//         shiftBreakdown[shift].projects++;
//         shiftBreakdown[shift].hours += project.hours;
//       });
//     });
    
//     // Count unique employees per shift
//     Object.keys(shiftBreakdown).forEach(shift => {
//       const employeesWithShift = new Set();
//       todayWorksheets.forEach(worksheet => {
//         const hasShift = worksheet.projects.some(p => p.shift === shift);
//         if (hasShift) employeesWithShift.add(worksheet.empId);
//       });
//       shiftBreakdown[shift].employees = employeesWithShift.size;
//     });

//     res.json({
//       success: true,
//       data: {
//         date: startOfDay,
//         summary: {
//           totalEmployees,
//           totalProjects,
//           totalHours,
//           averageHoursPerEmployee: totalEmployees > 0 ? (totalHours / totalEmployees).toFixed(2) : 0
//         },
//         breakdown: {
//           bySheet: sheetBreakdown,
//           byShift: shiftBreakdown
//         },
//         worksheets: todayWorksheets
//       }
//     });
//   } catch (error) {
//     console.error('Get all today worksheets error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// // ==================== GET TODAY'S WORKSHEETS BY SHEET TYPE ====================
// // @desc    Get today's worksheets filtered by sheet type
// // @route   GET /api/worksheets/today/sheet/:sheetType
// const getTodayWorksheetsBySheet = async (req, res) => {
//   try {
//     const { sheetType } = req.params;
//     const validSheets = ['frontend', 'backend', 'testing', 'design', 'Full Stack', 'Digital Marketing'];
    
//     if (!validSheets.includes(sheetType)) {
//       return res.status(400).json({
//         success: false,
//         message: `Invalid sheet type. Must be one of: ${validSheets.join(', ')}`
//       });
//     }

//     // Get today's date range
//     const today = new Date();
//     const startOfDay = new Date(today.setHours(0, 0, 0, 0));
//     const endOfDay = new Date(today.setHours(23, 59, 59, 999));

//     const query = {
//       sheet: sheetType,
//       'projects': {
//         $elemMatch: {
//           startDate: { $lte: endOfDay },
//           endDate: { $gte: startOfDay }
//         }
//       }
//     };

//     const worksheets = await Worksheet.find(query).sort({ employName: 1 });

//     const todayWorksheets = worksheets.map(worksheet => ({
//       worksheetId: worksheet._id,
//       empId: worksheet.empId,
//       employName: worksheet.employName,
//       sheet: worksheet.sheet,
//       projects: worksheet.projects.filter(project => {
//         const projectStart = new Date(project.startDate);
//         const projectEnd = new Date(project.endDate);
//         return projectStart <= endOfDay && projectEnd >= startOfDay;
//       }).map(project => ({
//         projectName: project.projectName,
//         hours: project.hours,
//         shift: project.shift,
//         comment: project.comment,
//         startDate: project.startDate,
//         endDate: project.endDate
//       }))
//     })).filter(w => w.projects.length > 0);

//     const totalEmployees = todayWorksheets.length;
//     const totalProjects = todayWorksheets.reduce((sum, w) => sum + w.projects.length, 0);
//     const totalHours = todayWorksheets.reduce((total, w) => {
//       return total + w.projects.reduce((sum, p) => sum + p.hours, 0);
//     }, 0);

//     res.json({
//       success: true,
//       data: {
//         sheetType,
//         date: startOfDay,
//         summary: {
//           totalEmployees,
//           totalProjects,
//           totalHours,
//           averageHoursPerEmployee: totalEmployees > 0 ? (totalHours / totalEmployees).toFixed(2) : 0
//         },
//         worksheets: todayWorksheets
//       }
//     });
//   } catch (error) {
//     console.error('Get today worksheets by sheet error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };


// module.exports = {
//   createWorksheet,
//   getAllWorksheets,
//   getWorksheetById,
//   updateWorksheet,
//   deleteWorksheet,
//   getStaffOptions,
//   getProjectOptions,
//   getWorksheetsByEmployee,
//   getWorksheetsByProject,
//   getWorksheetStats,
//   exportWorksheets,
//   getEmployeeTodayWorksheets,
//   getAllTodayWorksheets,
//   getTodayWorksheetsBySheet
// };


const Worksheet = require('../models/Worksheet');
const { Staff } = require('../models/Staff');

// ==================== CREATE WORKSHEET ====================
// @desc    Create new worksheet
// @route   POST /api/worksheets
const createWorksheet = async (req, res) => {
  try {
    console.log("📝 Creating new worksheet");
    console.log("req.body:", req.body);
    
    const { empId, employName, sheet, projects } = req.body;

    // Validate required fields
    if (!empId || !employName || !sheet) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID, name, and sheet type are required'
      });
    }

    if (!projects || projects.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one project assignment is required'
      });
    }

    // Validate each project
    for (const project of projects) {
      if (!project.projectName || !project.startDate || !project.endDate || !project.hours) {
        return res.status(400).json({
          success: false,
          message: 'Each project must have name, start date, end date, and hours'
        });
      }
      
      // Check if end date is after start date
      if (new Date(project.endDate) < new Date(project.startDate)) {
        return res.status(400).json({
          success: false,
          message: `End date must be after start date for project: ${project.projectName}`
        });
      }
    }

    const worksheet = new Worksheet({
      empId,
      employName,
      sheet,
      projects
    });

    await worksheet.save();

    res.status(201).json({
      success: true,
      message: 'Worksheet created successfully',
      data: worksheet
    });
  } catch (error) {
    console.error('Create worksheet error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating worksheet'
    });
  }
};

// ==================== GET ALL WORKSHEETS ====================
// @desc    Get all worksheets with pagination and filters
// @route   GET /api/worksheets
const getAllWorksheets = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sheet, project } = req.query;
    const query = {};

    // Search by employee ID or name
    if (search) {
      query.$or = [
        { empId: { $regex: search, $options: 'i' } },
        { employName: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by sheet type
    if (sheet) {
      query.sheet = sheet;
    }

    // Filter by project name
    if (project) {
      query['projects.projectName'] = { $regex: project, $options: 'i' };
    }

    const total = await Worksheet.countDocuments(query);
    const worksheets = await Worksheet.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: worksheets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get worksheets error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== GET WORKSHEET BY ID ====================
// @desc    Get worksheet by ID
// @route   GET /api/worksheets/:id
const getWorksheetById = async (req, res) => {
  try {
    const { id } = req.params;
    const worksheet = await Worksheet.findById(id);

    if (!worksheet) {
      return res.status(404).json({
        success: false,
        message: 'Worksheet not found'
      });
    }

    res.json({
      success: true,
      data: worksheet
    });
  } catch (error) {
    console.error('Get worksheet error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== UPDATE WORKSHEET ====================
// @desc    Update worksheet
// @route   PUT /api/worksheets/:id
const updateWorksheet = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const worksheet = await Worksheet.findById(id);
    if (!worksheet) {
      return res.status(404).json({
        success: false,
        message: 'Worksheet not found'
      });
    }

    // Validate projects if present
    if (updateData.projects && updateData.projects.length > 0) {
      for (const project of updateData.projects) {
        if (project.projectName && (!project.startDate || !project.endDate || !project.hours)) {
          return res.status(400).json({
            success: false,
            message: 'Each project must have name, start date, end date, and hours'
          });
        }
        
        if (project.startDate && project.endDate && new Date(project.endDate) < new Date(project.startDate)) {
          return res.status(400).json({
            success: false,
            message: `End date must be after start date for project: ${project.projectName}`
          });
        }
      }
    }

    // Remove fields that shouldn't be updated
    delete updateData._id;
    delete updateData.createdAt;

    const updatedWorksheet = await Worksheet.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Worksheet updated successfully',
      data: updatedWorksheet
    });
  } catch (error) {
    console.error('Update worksheet error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== DELETE WORKSHEET ====================
// @desc    Delete worksheet
// @route   DELETE /api/worksheets/:id
const deleteWorksheet = async (req, res) => {
  try {
    const { id } = req.params;
    const worksheet = await Worksheet.findByIdAndDelete(id);

    if (!worksheet) {
      return res.status(404).json({
        success: false,
        message: 'Worksheet not found'
      });
    }

    res.json({
      success: true,
      message: 'Worksheet deleted successfully'
    });
  } catch (error) {
    console.error('Delete worksheet error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== STAFF OPTIONS ====================
// @desc    Get staff options for dropdown (active staff only)
// @route   GET /api/worksheets/staff-options
const getStaffOptions = async (req, res) => {
  try {
    const staff = await Staff.find({ isActive: true })
      .select('employeeId employeeName')
      .sort({ employeeName: 1 });

    const options = staff.map(s => ({
      id: s._id,
      staffId: s.employeeId,
      staffName: s.employeeName
    }));

    res.json({
      success: true,
      data: options
    });
  } catch (error) {
    console.error('Get staff options error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== PROJECT OPTIONS ====================
// @desc    Get unique project names from existing worksheets
// @route   GET /api/worksheets/project-options
const getProjectOptions = async (req, res) => {
  try {
    const projects = await Worksheet.aggregate([
      { $unwind: '$projects' },
      { $group: { _id: '$projects.projectName' } },
      { $sort: { _id: 1 } }
    ]);

    const options = projects.map(p => ({
      id: p._id,
      projectName: p._id
    }));

    res.json({
      success: true,
      data: options
    });
  } catch (error) {
    console.error('Get project options error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== GET WORKSHEETS BY EMPLOYEE ====================
// @desc    Get all worksheets for a specific employee
// @route   GET /api/worksheets/employee/:empId
const getWorksheetsByEmployee = async (req, res) => {
  try {
    const { empId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const query = { empId: { $regex: empId, $options: 'i' } };
    const total = await Worksheet.countDocuments(query);
    const worksheets = await Worksheet.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    if (!worksheets || worksheets.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No worksheets found for employee ID: ${empId}`
      });
    }

    res.json({
      success: true,
      data: worksheets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get worksheets by employee error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== GET WORKSHEETS BY PROJECT ====================
// @desc    Get all worksheets containing a specific project
// @route   GET /api/worksheets/project/:projectName
const getWorksheetsByProject = async (req, res) => {
  try {
    const { projectName } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const query = { 'projects.projectName': { $regex: projectName, $options: 'i' } };
    const total = await Worksheet.countDocuments(query);
    const worksheets = await Worksheet.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    if (!worksheets || worksheets.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No worksheets found for project: ${projectName}`
      });
    }

    res.json({
      success: true,
      data: worksheets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get worksheets by project error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== GET WORKSHEET STATISTICS ====================
// @desc    Get worksheet statistics
// @route   GET /api/worksheets/stats
const getWorksheetStats = async (req, res) => {
  try {
    // Total worksheets
    const totalWorksheets = await Worksheet.countDocuments();
    
    // Worksheets by sheet type
    const sheetStats = await Worksheet.aggregate([
      { $group: { _id: '$sheet', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Total projects assigned
    const totalProjects = await Worksheet.aggregate([
      { $project: { projectCount: { $size: '$projects' } } },
      { $group: { _id: null, total: { $sum: '$projectCount' } } }
    ]);
    
    // Total hours across all projects
    const totalHours = await Worksheet.aggregate([
      { $unwind: '$projects' },
      { $group: { _id: null, totalHours: { $sum: '$projects.hours' } } }
    ]);
    
    // Active employees (unique employees with worksheets)
    const activeEmployees = await Worksheet.distinct('empId');
    
    // Recent worksheets (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentWorksheets = await Worksheet.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    // Worksheets by status (based on date ranges)
    const today = new Date();
    const activeProjects = await Worksheet.aggregate([
      { $unwind: '$projects' },
      { 
        $match: { 
          'projects.endDate': { $gte: today }
        } 
      },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);
    
    // Upcoming deadlines (projects ending in next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const upcomingDeadlines = await Worksheet.aggregate([
      { $unwind: '$projects' },
      { 
        $match: { 
          'projects.endDate': { $gte: today, $lte: nextWeek }
        } 
      },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalWorksheets,
        sheetStats,
        totalProjects: totalProjects[0]?.total || 0,
        totalHours: totalHours[0]?.totalHours || 0,
        activeEmployees: activeEmployees.length,
        recentWorksheets,
        activeProjects: activeProjects[0]?.count || 0,
        upcomingDeadlines: upcomingDeadlines[0]?.count || 0
      }
    });
  } catch (error) {
    console.error('Get worksheet stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== EXPORT WORKSHEETS ====================
// @desc    Export worksheets within date range
// @route   POST /api/worksheets/export
const exportWorksheets = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const worksheets = await Worksheet.find({
      'projects.startDate': { $lte: end },
      'projects.endDate': { $gte: start }
    });

    const exportData = [];
    worksheets.forEach(worksheet => {
      worksheet.projects.forEach(project => {
        const projectStart = new Date(project.startDate);
        const projectEnd = new Date(project.endDate);
        
        if (projectStart <= end && projectEnd >= start) {
          exportData.push({
            EmployeeID: worksheet.empId,
            Name: worksheet.employName,
            Sheet: worksheet.sheet,
            Project: project.projectName,
            Start: project.startDate,
            End: project.endDate,
            Hours: project.hours,
            Shift: project.shift,
            Comment: project.comment || ''
          });
        }
      });
    });

    res.json({
      success: true,
      data: exportData,
      count: exportData.length
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== GET TODAY'S WORKSHEETS FOR EMPLOYEE ====================
// @desc    Get today's worksheets for a specific employee
// @route   GET /api/worksheets/employee/:empId/today
const getEmployeeTodayWorksheets = async (req, res) => {
  try {
    const { empId } = req.params;
    
    // Get today's date (start of day to end of day)
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Find worksheets for the employee where any project includes today's date
    const query = {
      empId: { $regex: empId, $options: 'i' },
      'projects': {
        $elemMatch: {
          startDate: { $lte: endOfDay },
          endDate: { $gte: startOfDay }
        }
      }
    };

    const worksheets = await Worksheet.find(query);

    if (!worksheets || worksheets.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No worksheets found for employee ID: ${empId} for today`,
        data: []
      });
    }

    // Filter and format only the projects that are active today
    const todayWorksheets = worksheets.map(worksheet => {
      const activeProjects = worksheet.projects.filter(project => {
        const projectStart = new Date(project.startDate);
        const projectEnd = new Date(project.endDate);
        return projectStart <= endOfDay && projectEnd >= startOfDay;
      });

      return {
        worksheetId: worksheet._id,
        empId: worksheet.empId,
        employName: worksheet.employName,
        sheet: worksheet.sheet,
        date: startOfDay,
        projects: activeProjects.map(project => ({
          projectName: project.projectName,
          hours: project.hours,
          shift: project.shift,
          comment: project.comment,
          startDate: project.startDate,
          endDate: project.endDate
        }))
      };
    });

    // Calculate total hours for today
    const totalHoursToday = todayWorksheets.reduce((total, worksheet) => {
      const worksheetHours = worksheet.projects.reduce((sum, project) => sum + project.hours, 0);
      return total + worksheetHours;
    }, 0);

    res.json({
      success: true,
      data: {
        employee: {
          empId: empId,
          name: todayWorksheets[0]?.employName || 'Unknown'
        },
        date: startOfDay,
        worksheets: todayWorksheets,
        summary: {
          totalProjects: todayWorksheets.reduce((sum, w) => sum + w.projects.length, 0),
          totalHours: totalHoursToday,
          sheetsCount: todayWorksheets.length
        }
      }
    });
  } catch (error) {
    console.error('Get employee today worksheets error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== GET TODAY'S WORKSHEETS FOR ALL EMPLOYEES ====================
// @desc    Get today's worksheets for all employees
// @route   GET /api/worksheets/today/all
const getAllTodayWorksheets = async (req, res) => {
  try {
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Find all worksheets with projects active today
    const query = {
      'projects': {
        $elemMatch: {
          startDate: { $lte: endOfDay },
          endDate: { $gte: startOfDay }
        }
      }
    };

    const worksheets = await Worksheet.find(query).sort({ employName: 1 });

    if (!worksheets || worksheets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No worksheets found for today',
        data: []
      });
    }

    // Process each worksheet to include only today's active projects
    const todayWorksheets = worksheets.map(worksheet => {
      const activeProjects = worksheet.projects.filter(project => {
        const projectStart = new Date(project.startDate);
        const projectEnd = new Date(project.endDate);
        return projectStart <= endOfDay && projectEnd >= startOfDay;
      });

      return {
        worksheetId: worksheet._id,
        empId: worksheet.empId,
        employName: worksheet.employName,
        sheet: worksheet.sheet,
        projects: activeProjects.map(project => ({
          projectName: project.projectName,
          hours: project.hours,
          shift: project.shift,
          comment: project.comment,
          startDate: project.startDate,
          endDate: project.endDate
        }))
      };
    }).filter(worksheet => worksheet.projects.length > 0);

    // Calculate summary statistics
    const totalEmployees = todayWorksheets.length;
    const totalProjects = todayWorksheets.reduce((sum, w) => sum + w.projects.length, 0);
    const totalHours = todayWorksheets.reduce((total, worksheet) => {
      const worksheetHours = worksheet.projects.reduce((sum, project) => sum + project.hours, 0);
      return total + worksheetHours;
    }, 0);

    // Group by sheet type
    const sheetBreakdown = {};
    todayWorksheets.forEach(worksheet => {
      if (!sheetBreakdown[worksheet.sheet]) {
        sheetBreakdown[worksheet.sheet] = {
          employees: 0,
          projects: 0,
          hours: 0
        };
      }
      sheetBreakdown[worksheet.sheet].employees++;
      sheetBreakdown[worksheet.sheet].projects += worksheet.projects.length;
      sheetBreakdown[worksheet.sheet].hours += worksheet.projects.reduce((sum, p) => sum + p.hours, 0);
    });

    // Group by shift
    const shiftBreakdown = {
      morning: { employees: 0, projects: 0, hours: 0 },
      afternoon: { employees: 0, projects: 0, hours: 0 },
      fullday: { employees: 0, projects: 0, hours: 0 }
    };
    
    todayWorksheets.forEach(worksheet => {
      worksheet.projects.forEach(project => {
        const shift = project.shift;
        if (!shiftBreakdown[shift]) {
          shiftBreakdown[shift] = { employees: 0, projects: 0, hours: 0 };
        }
        shiftBreakdown[shift].projects++;
        shiftBreakdown[shift].hours += project.hours;
      });
    });
    
    // Count unique employees per shift
    Object.keys(shiftBreakdown).forEach(shift => {
      const employeesWithShift = new Set();
      todayWorksheets.forEach(worksheet => {
        const hasShift = worksheet.projects.some(p => p.shift === shift);
        if (hasShift) employeesWithShift.add(worksheet.empId);
      });
      shiftBreakdown[shift].employees = employeesWithShift.size;
    });

    res.json({
      success: true,
      data: {
        date: startOfDay,
        summary: {
          totalEmployees,
          totalProjects,
          totalHours,
          averageHoursPerEmployee: totalEmployees > 0 ? (totalHours / totalEmployees).toFixed(2) : 0
        },
        breakdown: {
          bySheet: sheetBreakdown,
          byShift: shiftBreakdown
        },
        worksheets: todayWorksheets
      }
    });
  } catch (error) {
    console.error('Get all today worksheets error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== GET TODAY'S WORKSHEETS BY SHEET TYPE ====================
// @desc    Get today's worksheets filtered by sheet type
// @route   GET /api/worksheets/today/sheet/:sheetType
const getTodayWorksheetsBySheet = async (req, res) => {
  try {
    const { sheetType } = req.params;
    const validSheets = ['frontend', 'backend', 'testing', 'design', 'Full Stack', 'Digital Marketing'];
    
    if (!validSheets.includes(sheetType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid sheet type. Must be one of: ${validSheets.join(', ')}`
      });
    }

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const query = {
      sheet: sheetType,
      'projects': {
        $elemMatch: {
          startDate: { $lte: endOfDay },
          endDate: { $gte: startOfDay }
        }
      }
    };

    const worksheets = await Worksheet.find(query).sort({ employName: 1 });

    const todayWorksheets = worksheets.map(worksheet => ({
      worksheetId: worksheet._id,
      empId: worksheet.empId,
      employName: worksheet.employName,
      sheet: worksheet.sheet,
      projects: worksheet.projects.filter(project => {
        const projectStart = new Date(project.startDate);
        const projectEnd = new Date(project.endDate);
        return projectStart <= endOfDay && projectEnd >= startOfDay;
      }).map(project => ({
        projectName: project.projectName,
        hours: project.hours,
        shift: project.shift,
        comment: project.comment,
        startDate: project.startDate,
        endDate: project.endDate
      }))
    })).filter(w => w.projects.length > 0);

    const totalEmployees = todayWorksheets.length;
    const totalProjects = todayWorksheets.reduce((sum, w) => sum + w.projects.length, 0);
    const totalHours = todayWorksheets.reduce((total, w) => {
      return total + w.projects.reduce((sum, p) => sum + p.hours, 0);
    }, 0);

    res.json({
      success: true,
      data: {
        sheetType,
        date: startOfDay,
        summary: {
          totalEmployees,
          totalProjects,
          totalHours,
          averageHoursPerEmployee: totalEmployees > 0 ? (totalHours / totalEmployees).toFixed(2) : 0
        },
        worksheets: todayWorksheets
      }
    });
  } catch (error) {
    console.error('Get today worksheets by sheet error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==================== TASK MANAGEMENT FUNCTIONS ====================

// @desc    Add task to a specific project
// @route   POST /api/worksheets/:worksheetId/project/:projectName/tasks
const addTaskToProject = async (req, res) => {
  try {
    const { worksheetId, projectName } = req.params;
    const { title, description, dueDate, estimatedHours, priority, category, assignedBy } = req.body;

    const worksheet = await Worksheet.findById(worksheetId);
    if (!worksheet) {
      return res.status(404).json({
        success: false,
        message: 'Worksheet not found'
      });
    }

    const project = worksheet.projects.find(p => p.projectName === projectName);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Initialize tasks array if it doesn't exist
    if (!project.tasks) {
      project.tasks = [];
    }

    const newTask = {
      title,
      description: description || '',
      category: category || 'work',
      dueDate,
      estimatedHours: estimatedHours || 0,
      priority: priority || 'medium',
      status: 'pending',
      assignedDate: new Date(),
      assignedBy: assignedBy || { empId: '', employeeName: '' },
      comments: []
    };

    project.tasks.push(newTask);
    await worksheet.save();

    res.status(201).json({
      success: true,
      message: 'Task added successfully',
      data: newTask
    });
  } catch (error) {
    console.error('Add task error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update task status
// @route   PUT /api/worksheets/:worksheetId/project/:projectName/task/:taskId/status
const updateTaskStatus = async (req, res) => {
  try {
    const { worksheetId, projectName, taskId } = req.params;
    const { status, actualHours } = req.body;

    const worksheet = await Worksheet.findById(worksheetId);
    if (!worksheet) {
      return res.status(404).json({
        success: false,
        message: 'Worksheet not found'
      });
    }

    const project = worksheet.projects.find(p => p.projectName === projectName);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const task = project.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.status = status;
    if (actualHours !== undefined) task.actualHours = actualHours;
    if (status === 'completed') task.completedDate = new Date();

    await worksheet.save();

    res.json({
      success: true,
      message: 'Task status updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Update task status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/worksheets/:worksheetId/project/:projectName/task/:taskId
const deleteTask = async (req, res) => {
  try {
    const { worksheetId, projectName, taskId } = req.params;

    const worksheet = await Worksheet.findById(worksheetId);
    if (!worksheet) {
      return res.status(404).json({
        success: false,
        message: 'Worksheet not found'
      });
    }

    const project = worksheet.projects.find(p => p.projectName === projectName);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    project.tasks = project.tasks.filter(t => t._id.toString() !== taskId);
    await worksheet.save();

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add comment to task
// @route   POST /api/worksheets/:worksheetId/project/:projectName/task/:taskId/comments
const addTaskComment = async (req, res) => {
  try {
    const { worksheetId, projectName, taskId } = req.params;
    const { text, postedBy } = req.body;

    const worksheet = await Worksheet.findById(worksheetId);
    if (!worksheet) {
      return res.status(404).json({
        success: false,
        message: 'Worksheet not found'
      });
    }

    const project = worksheet.projects.find(p => p.projectName === projectName);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const task = project.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (!task.comments) task.comments = [];
    task.comments.push({
      text,
      postedBy,
      postedAt: new Date()
    });

    await worksheet.save();

    res.json({
      success: true,
      message: 'Comment added successfully',
      data: task.comments
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all tasks for an employee
// @route   GET /api/worksheets/employee/:empId/tasks
const getEmployeeTasks = async (req, res) => {
  try {
    const { empId } = req.params;
    const worksheet = await Worksheet.findOne({ empId });

    if (!worksheet) {
      return res.json({
        success: true,
        data: [],
        total: 0
      });
    }

    const allTasks = [];
    worksheet.projects.forEach(project => {
      if (project.tasks && project.tasks.length > 0) {
        project.tasks.forEach(task => {
          allTasks.push({
            id: task._id,
            title: task.title,
            description: task.description,
            category: task.category,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
            assignedDate: task.assignedDate,
            completedDate: task.completedDate,
            estimatedHours: task.estimatedHours,
            actualHours: task.actualHours,
            assigner: task.assignedBy?.employeeName || worksheet.employName,
            projectName: project.projectName,
            worksheetId: worksheet._id
          });
        });
      }
    });

    res.json({
      success: true,
      data: allTasks,
      total: allTasks.length
    });
  } catch (error) {
    console.error('Get employee tasks error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get tasks for a specific project
// @route   GET /api/worksheets/:worksheetId/project/:projectName/tasks
const getProjectTasks = async (req, res) => {
  try {
    const { worksheetId, projectName } = req.params;

    const worksheet = await Worksheet.findById(worksheetId);
    if (!worksheet) {
      return res.status(404).json({
        success: false,
        message: 'Worksheet not found'
      });
    }

    const project = worksheet.projects.find(p => p.projectName === projectName);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const tasks = project.tasks || [];

    res.json({
      success: true,
      data: tasks,
      total: tasks.length
    });
  } catch (error) {
    console.error('Get project tasks error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  createWorksheet,
  getAllWorksheets,
  getWorksheetById,
  updateWorksheet,
  deleteWorksheet,
  getStaffOptions,
  getProjectOptions,
  getWorksheetsByEmployee,
  getWorksheetsByProject,
  getWorksheetStats,
  exportWorksheets,
  getEmployeeTodayWorksheets,
  getAllTodayWorksheets,
  getTodayWorksheetsBySheet,
  // New task management functions
  addTaskToProject,
  updateTaskStatus,
  deleteTask,
  addTaskComment,
  getEmployeeTasks,
  getProjectTasks
};