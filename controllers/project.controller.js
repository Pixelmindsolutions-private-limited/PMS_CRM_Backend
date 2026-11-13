// controllers/project.controller.js
const mongoose = require("mongoose");
const Project = require("../models/Project");
const Client = require("../models/Client");
const Invoice = require("../models/Invoice");


// ✅ Add the helpers here
const roundAmount = (value) => Number(Number(value).toFixed(2));

const getProjectPaymentTotals = (project) => {
  const baseCost = Number(project.projectCost || 0);
  const gstPercent = Number(project.gstPercent || 0);

  const gstAmount = roundAmount((baseCost * gstPercent) / 100);
  const projectCost = roundAmount(baseCost + gstAmount);

  const totalPaid = roundAmount(
    (project.installments || []).reduce(
      (sum, installment) => sum + Number(installment.paidAmount || 0),
      0
    )
  );

  return {
    projectCost,
    totalPaid,
    remainingAmount: roundAmount(Math.max(0, projectCost - totalPaid)),
  };
};



/* ================================================================
 * CREATE PROJECT — accepts gstPercent only
 * ================================================================ */
exports.createProject = async (req, res) => {
  try {
    const {
      clientId,
      clientName,
      mobileNumber,
      mailId,
      projectName,
      projectCost,
      projectStartDate,
      projectEndDate,
      deadline,
      paymentMilestone,
      category,
      gstPercent = 18,
      workDivision,
      teamAssignment,
      digitalMarketing,
    } = req.body;

    if (
      !String(projectName || "").trim() ||
      !String(clientName || "").trim() ||
      !String(mobileNumber || "").trim() ||
      !String(mailId || "").trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Project name, client name, mobile number and mail id are required",
      });
    }

    const gstRate = Number(gstPercent);

    if (
      !Number.isFinite(gstRate) ||
      gstRate < 0 ||
      gstRate > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "gstPercent must be between 0 and 100",
      });
    }

    if (clientId && !mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid client ID",
      });
    }

    const client = clientId ? await Client.findById(clientId) : null;

    if (clientId && !client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    let finalProjectCost = Number(projectCost ?? 0);
    let digitalMarketingData = null;

    if (category === "digital marketing" && digitalMarketing) {
      const DigitalMarketingPlan = require("../models/DigitalMarketingPlan");

      if (
        !digitalMarketing.planId ||
        !mongoose.Types.ObjectId.isValid(digitalMarketing.planId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid digital marketing plan ID",
        });
      }

      const plan = await DigitalMarketingPlan.findById(
        digitalMarketing.planId
      );

      if (!plan) {
        return res.status(404).json({
          success: false,
          message: "Digital marketing plan not found",
        });
      }

      const durationData = plan.durations.find(
        (item) => item.duration === digitalMarketing.duration
      );

      if (!durationData) {
        return res.status(400).json({
          success: false,
          message: "Invalid duration for this plan",
        });
      }

      finalProjectCost = Number(durationData.price);

      digitalMarketingData = {
        planId: plan._id,
        planName: plan.planName,
        duration: digitalMarketing.duration,
        price: durationData.price,
        features: plan.features || [],
      };
    }

    if (!Number.isFinite(finalProjectCost) || finalProjectCost < 0) {
      return res.status(400).json({
        success: false,
        message: "projectCost must be a valid non-negative number",
      });
    }

    const milestoneCount = Number(paymentMilestone ?? 0);

    if (!Number.isFinite(milestoneCount) || milestoneCount < 0) {
      return res.status(400).json({
        success: false,
        message: "paymentMilestone must be a valid non-negative number",
      });
    }

    const project = new Project({
      ...(client ? { clientId: client._id } : {}),
      clientName: client?.name || String(clientName).trim(),
      mobileNumber: client?.mobile || String(mobileNumber).trim(),
      mailId: client?.email || String(mailId).trim(),
      projectName: String(projectName).trim(),

      // Keep the base amount for existing installment calculations.
      projectCost: roundAmount(finalProjectCost),
      gstPercent: gstRate,

      projectStartDate: projectStartDate || null,
      projectEndDate: projectEndDate || null,
      deadline: deadline || null,
      paymentMilestone: milestoneCount,
      category: category || "website",

      workDivision: workDivision || {
        designing: 0,
        frontend: 0,
        backend: 0,
        testing: 0,
        deployment: 0,
        marketing: 0,
      },

      teamAssignment: teamAssignment || {
        designing: [],
        frontend: [],
        backend: [],
        testing: [],
        deployment: [],
        marketing: [],
      },

      digitalMarketing: digitalMarketingData,
    });

    await project.save();

    const populated = await Project.findById(project._id)
      .populate("clientId", "name email mobile address")
      .select("-__v");

    const totals = getProjectPaymentTotals(populated);

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: {
        _id: populated._id,
        projectId: populated.projectId,
        projectName: populated.projectName,
        clientName: populated.clientName,
        mobileNumber: populated.mobileNumber,
        mailId: populated.mailId,

        // GST-inclusive amount in the existing field.
        projectCost: totals.projectCost,
        gstPercent: populated.gstPercent,

        projectStartDate: populated.projectStartDate,
        projectEndDate: populated.projectEndDate,
        deadline: populated.deadline,
        paymentMilestone: populated.paymentMilestone,
        category: populated.category,
        workDivision: populated.workDivision,
        teamAssignment: populated.teamAssignment,
        digitalMarketing: populated.digitalMarketing || null,

        client: populated.clientId
          ? {
              _id: populated.clientId._id,
              name: populated.clientId.name,
              mobile: populated.clientId.mobile,
              email: populated.clientId.email,
              address: populated.clientId.address,
            }
          : null,

        status: "active",
        createdAt: populated.createdAt,
        updatedAt: populated.updatedAt,
      },
    });
  } catch (error) {
    console.error("Create project error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate value found. Please try again.",
      });
    }

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Server error while creating project",
    });
  }
};

/* ================================================================
 * READ
 * ================================================================ */
exports.getAllProjects = async (req, res) => {
  try {
    const { search, category, clientId, isDeleted, projectId, projectName } =
      req.query;

    const query = {};
    query.isDeleted = isDeleted === "true";

    if (search) {
      query.$or = [
        { projectName: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
        { projectId: { $regex: search, $options: "i" } },
      ];
    }
    if (projectId) query.projectId = { $regex: projectId, $options: "i" };
    if (projectName) query.projectName = { $regex: projectName, $options: "i" };
    if (category) query.category = category;
    if (clientId) query.clientId = clientId;

    const projects = await Project.find(query)
      .populate("clientId", "name email mobile address")
      .select("-__v")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: projects.length,
      data: projects.map((p) => ({
        _id: p._id,
        projectId: p.projectId,
        projectName: p.projectName,
        projectCost: p.projectCost,
        gstPercent: p.gstPercent,
        totalPaid: p.totalPaid,
        remainingAmount: p.remainingAmount,
        projectStartDate: p.projectStartDate,
        projectEndDate: p.projectEndDate,
        deadline: p.deadline,
        paymentMilestone: p.paymentMilestone,
        category: p.category,
        workDivision: p.workDivision,
        teamAssignment: p.teamAssignment,
        digitalMarketing: p.digitalMarketing || null,
        client: {
          _id: p.clientId?._id,
          name: p.clientId?.name || "Unknown Client",
          mobile: p.clientId?.mobile || "",
          email: p.clientId?.email || "",
          address: p.clientId?.address || "",
        },
        installments: p.installments || [],
        status: p.isDeleted ? "deleted" : "active",
        deletedAt: p.deletedAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Get all projects error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID format",
      });
    }

    const project = await Project.findById(id)
      .populate("clientId", "name email mobile address")
      .select("-__v");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const totals = getProjectPaymentTotals(project);

    return res.json({
      success: true,
      data: {
        _id: project._id,
        projectId: project.projectId,
        projectName: project.projectName,
        projectCost: totals.projectCost,
        gstPercent: project.gstPercent,
        totalPaid: totals.totalPaid,
        remainingAmount: totals.remainingAmount,
        projectStartDate: project.projectStartDate,
        projectEndDate: project.projectEndDate,
        deadline: project.deadline,
        paymentMilestone: project.paymentMilestone,
        category: project.category,
        workDivision: project.workDivision,
        teamAssignment: project.teamAssignment,
        digitalMarketing: project.digitalMarketing || null,

        client: {
          _id: project.clientId?._id || null,
          name:
            project.clientId?.name ||
            project.clientName ||
            "Unknown Client",
          mobile: project.clientId?.mobile || project.mobileNumber || "",
          email: project.clientId?.email || project.mailId || "",
          address: project.clientId?.address || "",
        },

        installments: project.installments,
        status: project.isDeleted ? "deleted" : "active",
        deletedAt: project.deletedAt,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get project error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getProjectOptions = async (req, res) => {
  try {
    const projects = await Project.find({ isDeleted: false })
      .select("projectId projectName category clientId")
      .populate("clientId", "name")
      .sort({ projectName: 1 });
    return res.json({
      success: true,
      data: projects.map((p) => ({
        _id: p._id,
        projectId: p.projectId,
        projectName: p.projectName,
        category: p.category,
        clientName: p.clientId ? p.clientId.name : "Unknown Client",
      })),
    });
  } catch (error) {
    console.error("Get project options error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProjectStats = async (req, res) => {
  try {
    const [total, categoryStats, totalCost, clientStats] =
      await Promise.all([
        Project.countDocuments({ isDeleted: false }),

        Project.aggregate([
          { $match: { isDeleted: false } },
          {
            $group: {
              _id: "$category",
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
        ]),

        Project.aggregate([
          { $match: { isDeleted: false } },
          {
            $project: {
              costIncludingGST: {
                $round: [
                  {
                    $add: [
                      { $ifNull: ["$projectCost", 0] },
                      {
                        $round: [
                          {
                            $divide: [
                              {
                                $multiply: [
                                  { $ifNull: ["$projectCost", 0] },
                                  { $ifNull: ["$gstPercent", 0] },
                                ],
                              },
                              100,
                            ],
                          },
                          2,
                        ],
                      },
                    ],
                  },
                  2,
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$costIncludingGST" },
            },
          },
        ]),

        Project.aggregate([
          { $match: { isDeleted: false } },
          {
            $group: {
              _id: "$clientId",
              projectCount: { $sum: 1 },
            },
          },
          { $sort: { projectCount: -1 } },
          { $limit: 10 },
        ]),
      ]);

    const clientIds = clientStats
      .map((item) => item._id)
      .filter(Boolean);

    const topClients = await Client.find({
      _id: { $in: clientIds },
    }).select("name email mobile");

    const clientsById = new Map(
      topClients.map((client) => [String(client._id), client])
    );

    return res.json({
      success: true,
      data: {
        totalProjects: total,
        totalProjectCost: roundAmount(totalCost[0]?.total || 0),

        categoryStats: categoryStats.map((item) => ({
          category: item._id,
          count: item.count,
        })),

        topClients: clientStats.map((item) => ({
          client: item._id
            ? clientsById.get(String(item._id)) || null
            : null,
          projectCount: item.projectCount,
        })),
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================================================================
 * UPDATE PROJECT
 * ================================================================ */
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const project = await Project.findOne({
      $or: [
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : []),
        { projectId: id },
      ],
      isDeleted: { $ne: true },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Update payload must contain the base cost, excluding GST.
    if (updateData.projectCost !== undefined) {
      const cost = Number(updateData.projectCost);

      if (!Number.isFinite(cost) || cost < 0) {
        return res.status(400).json({
          success: false,
          message: "projectCost must be a valid non-negative number",
        });
      }

      updateData.projectCost = roundAmount(cost);
    }

    if (updateData.paymentMilestone !== undefined) {
      const milestone = Number(updateData.paymentMilestone);

      if (!Number.isFinite(milestone) || milestone < 0) {
        return res.status(400).json({
          success: false,
          message: "paymentMilestone must be a valid non-negative number",
        });
      }

      if (milestone > 0 && project.installments.length > milestone) {
        return res.status(400).json({
          success: false,
          message: `Cannot have more than ${milestone} installments`,
        });
      }

      updateData.paymentMilestone = milestone;
    }

    if (updateData.gstPercent !== undefined) {
      const gstRate = Number(updateData.gstPercent);

      if (
        !Number.isFinite(gstRate) ||
        gstRate < 0 ||
        gstRate > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "gstPercent must be between 0 and 100",
        });
      }

      updateData.gstPercent = gstRate;
    }

    // Existing installments/invoices depend on these original values.
    const costChanged =
      updateData.projectCost !== undefined &&
      updateData.projectCost !== Number(project.projectCost);

    const gstChanged =
      updateData.gstPercent !== undefined &&
      updateData.gstPercent !== Number(project.gstPercent);

    if (
      project.installments.length > 0 &&
      (costChanged || gstChanged)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Project cost or GST cannot be changed after installments are created",
      });
    }

    // Only ordinary editable project fields are accepted.
    const editableFields = [
      "clientName",
      "mobileNumber",
      "mailId",
      "projectName",
      "projectCost",
      "gstPercent",
      "projectStartDate",
      "projectEndDate",
      "deadline",
      "paymentMilestone",
      "category",
      "workDivision",
      "teamAssignment",
      "digitalMarketing",
    ];

    for (const field of editableFields) {
      if (Object.prototype.hasOwnProperty.call(updateData, field)) {
        project.set(field, updateData[field]);
      }
    }

    // Runs validation and the model's payment-summary pre-save hook.
    await project.save();

    const updated = await Project.findById(project._id)
      .populate("clientId", "name email mobile address")
      .select("-__v");

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const totals = getProjectPaymentTotals(updated);

    return res.json({
      success: true,
      message: "Project updated successfully",
      data: {
        ...updated.toObject(),
        projectCost: totals.projectCost,
        totalPaid: totals.totalPaid,
        remainingAmount: totals.remainingAmount,
      },
    });
  } catch (error) {
    console.error("Update project error:", error);

    const status =
      error.name === "ValidationError" || error.name === "CastError"
        ? 400
        : 500;

    return res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================================================================
 * DELETE
 * ================================================================ */
exports.bulkDeleteProjects = async (req, res) => {
  try {
    const { projectIds } = req.body;
    const { permanent } = req.query;
    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Project IDs array is required" });
    }
    const projects = await Project.find({ _id: { $in: projectIds } });
    if (projects.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "No projects found" });

    if (permanent === "true") {
      await Project.deleteMany({ _id: { $in: projectIds } });
      return res.json({
        success: true,
        message: `${projects.length} projects permanently deleted`,
        data: { deletedCount: projects.length },
      });
    }

    const deleted = [];
    for (const project of projects) {
      if (!project.isDeleted) {
        project.isDeleted = true;
        project.deletedAt = new Date();
        await project.save();
        deleted.push({
          _id: project._id,
          projectId: project.projectId,
          projectName: project.projectName,
        });
      }
    }
    return res.json({
      success: true,
      message: `${deleted.length} projects deleted successfully`,
      data: { deletedCount: deleted.length, deletedProjects: deleted },
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid project ID format" });
    const project = await Project.findById(req.params.id);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    if (!project.isDeleted) {
      project.isDeleted = true;
      project.deletedAt = new Date();
      await project.save();
    }
    return res.json({
      success: true,
      message: "Project deleted successfully",
      data: {
        _id: project._id,
        projectId: project.projectId,
        projectName: project.projectName,
        deletedAt: project.deletedAt,
      },
    });
  } catch (error) {
    console.error("Delete project error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.restoreProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    if (!project.isDeleted)
      return res
        .status(400)
        .json({ success: false, message: "Project is not deleted" });
    project.isDeleted = false;
    project.deletedAt = null;
    await project.save();
    return res.json({
      success: true,
      message: "Project restored successfully",
      data: {
        _id: project._id,
        projectId: project.projectId,
        projectName: project.projectName,
        status: "active",
      },
    });
  } catch (error) {
    console.error("Restore project error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.permanentDeleteProjects = async (req, res) => {
  try {
    const { id } = req.params;
    const { projectIds } = req.body;
    const ObjectId = mongoose.Types.ObjectId;

    if (Array.isArray(projectIds) && projectIds.length > 0) {
      const invalid = projectIds.filter((p) => !ObjectId.isValid(p));
      if (invalid.length > 0)
        return res.status(400).json({
          success: false,
          message: "Invalid project ID format",
          invalidIds: invalid,
        });
      const projects = await Project.find({ _id: { $in: projectIds } });
      if (projects.length === 0)
        return res
          .status(404)
          .json({ success: false, message: "No projects found" });
      await Project.deleteMany({ _id: { $in: projectIds } });
      return res.json({
        success: true,
        message: `${projects.length} projects permanently deleted`,
        data: { deletedCount: projects.length },
      });
    }

    if (!id)
      return res
        .status(400)
        .json({ success: false, message: "Project ID is required" });
    if (!ObjectId.isValid(id))
      return res
        .status(400)
        .json({ success: false, message: "Invalid project ID format" });
    const project = await Project.findById(id);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    await Project.findByIdAndDelete(id);
    return res.json({
      success: true,
      message: "Project permanently deleted",
      data: {
        _id: project._id,
        projectId: project.projectId,
        projectName: project.projectName,
      },
    });
  } catch (error) {
    console.error("Permanent delete error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ================================================================
 * ADD INSTALLMENT — GST inherited from PROJECT
 * ================================================================ */
exports.addProjectInstallment = async (req, res) => {
  try {
    const { projectId } = req.params;

    const {
      title,
      type = "amount",
      value,
      sacCode = "",
      dueDate = null,
      notes = "",
    } = req.body;

    /* ---------- 1. Validate payload ---------- */
    if (!title || !String(title).trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Installment title is required" });
    }
    if (!["amount", "percentage"].includes(type)) {
      return res
        .status(400)
        .json({ success: false, message: "Type must be amount or percentage" });
    }

    const amountValue = Number(value);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      return res.status(400).json({
        success: false,
        message: "Installment value must be greater than zero",
      });
    }

    /* ---------- 2. Find project ---------- */
    let project = null;
    if (mongoose.Types.ObjectId.isValid(projectId)) {
      project = await Project.findOne({
        _id: projectId,
        isDeleted: { $ne: true },
      });
    }
    if (!project) {
      project = await Project.findOne({
        projectId,
        isDeleted: { $ne: true },
      });
    }
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    /* ---------- 3. Resolve client ---------- */
    let client = null;
    if (
      project.clientId &&
      mongoose.Types.ObjectId.isValid(String(project.clientId))
    ) {
      client = await Client.findById(project.clientId);
    }
    if (!client && project.mailId) {
      const email = String(project.mailId).trim();
      client = await Client.findOne({
        email: {
          $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          $options: "i",
        },
      });
    }
    if (!client && project.mobileNumber) {
      const mobile = String(project.mobileNumber).replace(/\D/g, "");
      if (mobile) {
        const clients = await Client.find();
        const matches = clients.filter(
          (c) => String(c.mobile || "").replace(/\D/g, "") === mobile,
        );
        if (matches.length === 1) client = matches[0];
      }
    }

    let createClientFromProject = false;
    if (!client) {
      const clientName = String(project.clientName || "").trim();
      const email = String(project.mailId || "").trim();
      const mobile = String(project.mobileNumber || "").trim();

      if (clientName) {
        const escaped = clientName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const matches = await Client.find({
          name: { $regex: `^\\s*${escaped}\\s*$`, $options: "i" },
        }).limit(2);
        if (matches.length === 1) client = matches[0];
        if (matches.length > 1) {
          return res.status(400).json({
            success: false,
            message:
              "Multiple clients match this project name; link the correct clientId first.",
          });
        }
      }
      if (!client && clientName && (email || mobile)) {
        createClientFromProject = true;
      }
    }

    if (!client && !createClientFromProject) {
      return res.status(400).json({
        success: false,
        message:
          "Client not found. Add a client name and email or mobile number to the project.",
      });
    }

    /* ---------- 4. Installment limit check ---------- */
    if (
      project.paymentMilestone > 0 &&
      project.installments.length >= project.paymentMilestone
    ) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${project.paymentMilestone} installments allowed`,
      });
    }

    /* ---------- 5. Compute principal + GST (from project.gstPercent) ---------- */
    const principalAmount =
      type === "percentage"
        ? (amountValue / 100) * Number(project.projectCost)
        : amountValue;

    const gstRate = Number(project.gstPercent || 0);
    const gstAmount = Number(((principalAmount * gstRate) / 100).toFixed(2));
    const totalAmount = Number((principalAmount + gstAmount).toFixed(2));

    /* ---------- 6. Guard: not exceed unallocated project cost ---------- */
    const allocatedAmount = project.installments.reduce((sum, inst) => {
      const p =
        inst.type === "percentage"
          ? (Number(inst.value) / 100) * Number(project.projectCost)
          : Number(inst.value);
      return sum + p;
    }, 0);

    if (
      allocatedAmount + principalAmount >
      Number(project.projectCost) + 0.01
    ) {
      return res.status(400).json({
        success: false,
        message: "Installment exceeds remaining unallocated project cost",
        projectCost: project.projectCost,
        allocatedAmount: Number(allocatedAmount.toFixed(2)),
        requestedAmount: Number(principalAmount.toFixed(2)),
        unallocatedBalance: Number(
          (project.projectCost - allocatedAmount).toFixed(2),
        ),
      });
    }

    /* ---------- 7. Save atomically ---------- */
    let savedInstallment;
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        project = await Project.findById(project._id).session(session);
        if (!project) throw new Error("Project not found during save");

        let txClient = null;
        if (
          project.clientId &&
          mongoose.Types.ObjectId.isValid(String(project.clientId))
        ) {
          txClient = await Client.findById(project.clientId).session(session);
        }
        if (!txClient && client && !createClientFromProject) {
          txClient = await Client.findById(client._id).session(session);
        }
        if (!txClient && createClientFromProject) {
          const [created] = await Client.create(
            [
              {
                name: String(project.clientName).trim(),
                email: String(project.mailId || "").trim(),
                mobile: String(project.mobileNumber || "").trim(),
              },
            ],
            { session },
          );
          txClient = created;
        }
        if (txClient) client = txClient;
        if (!client) throw new Error("A valid Client record is required");
        project.clientId = client._id;

        // ⚠️ HARD RULE: installment is ALWAYS created as unpaid.
        // No invoice is generated here. totalPaid is NOT affected.
        project.installments.push({
          title: String(title).trim(),
          type,
          value: amountValue,
          sacCode: String(sacCode || "").trim(),
          gstAmount,
          totalAmount,
          dueDate: dueDate || null,
          paymentDate: null,
          status: "pending",        // legacy field, kept for compatibility
          paymentStatus: "unpaid",  // ← always unpaid at creation
          paidAmount: 0,            // ← always zero at creation
          requestedAmount: 0,
          pendingRequestId: null,
          notes: String(notes || "").trim(),
        });

        savedInstallment =
          project.installments[project.installments.length - 1];

        project.calculatePaymentSummary();
        await project.save({ session });
        // No invoice creation here — invoices are only created on approval.
      });
    } finally {
      await session.endSession();
    }

    /* ---------- 8. Respond ---------- */
    const totalAllocated = allocatedAmount + principalAmount;
    const unallocatedBalance = Number(
      Math.max(0, project.projectCost - totalAllocated).toFixed(2),
    );

    return res.status(201).json({
      success: true,
      message:
        "Installment saved as unpaid. Invoice will be generated after admin approval of client payment.",
      data: {
        projectId: project.projectId,
        installmentId: savedInstallment._id,
        invoiceId: null,
        invoiceNumber: null,
        installment: savedInstallment,
        taxRate: { gstPercent: project.gstPercent },
        totalPaid: project.totalPaid,
        remainingAmount: project.remainingAmount,
        unallocatedBalance,
      },
    });
  } catch (error) {
    console.error("Add project installment error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add installment",
    });
  }
};


/* ================================================================
 * GET INSTALLMENTS
 * ================================================================ */
exports.getInstallments = async (req, res) => {
  try {
    const { projectId } = req.params;

    const filter = { isDeleted: { $ne: true } };
    if (mongoose.Types.ObjectId.isValid(projectId)) filter._id = projectId;
    else filter.projectId = projectId;

    const project = await Project.findOne(filter).select(
      "projectId projectName projectCost gstPercent paymentMilestone installments totalPaid remainingAmount",
    );
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    const installments = project.installments.map((i) => ({
      _id: i._id,
      title: i.title,
      type: i.type,
      value: i.value,
      sacCode: i.sacCode,
      gstAmount: i.gstAmount,
      totalAmount: i.totalAmount,
      dueDate: i.dueDate,
      paymentDate: i.paymentDate,
      status: i.status,
      paymentStatus: i.paymentStatus,
      paidAmount: i.paidAmount,
      requestedAmount: i.requestedAmount,
      pendingRequestId: i.pendingRequestId,
      invoiceNumber: i.invoiceNumber,
      notes: i.notes,
    }));

    return res.json({
      success: true,
      data: {
        projectId: project.projectId,
        projectName: project.projectName,
        projectCost: project.projectCost,
        gstPercent: project.gstPercent,
        totalPaid: project.totalPaid,
        remainingAmount: project.remainingAmount,
        maxInstallments: project.paymentMilestone,
        installments,
        summary: {
          totalInstallments: installments.length,
          paid: installments.filter((i) => i.paymentStatus === "paid").length,
          pendingApproval: installments.filter(
            (i) => i.paymentStatus === "pending_approval",
          ).length,
          partialApproved: installments.filter(
            (i) => i.paymentStatus === "partial_approved",
          ).length,
          unpaid: installments.filter((i) => i.paymentStatus === "unpaid")
            .length,
        },
      },
    });
  } catch (error) {
    console.error("getInstallments error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ================================================================
 * EDIT INSTALLMENT — NO GST fields (uses project GST via helper)
 * ================================================================ */
exports.editInstallment = async (req, res) => {
  try {
    const { projectId, installmentId } = req.params;
    const { title, type, value, dueDate, sacCode, notes } = req.body;

    const filter = { isDeleted: { $ne: true } };
    if (mongoose.Types.ObjectId.isValid(projectId)) filter._id = projectId;
    else filter.projectId = projectId;

    const project = await Project.findOne(filter);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });

    const inst = project.installments.id(installmentId);
    if (!inst)
      return res
        .status(404)
        .json({ success: false, message: "Installment not found" });

    if (inst.paymentStatus === "paid") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot edit a paid installment" });
    }
    if (inst.paymentStatus === "pending_approval") {
      return res.status(400).json({
        success: false,
        message:
          "Installment has a pending payment request. Approve or reject it first.",
      });
    }

    if (title !== undefined) inst.title = String(title).trim();
    if (type !== undefined) inst.type = type;
    if (value !== undefined) inst.value = Number(value);
    if (dueDate !== undefined)
      inst.dueDate = dueDate ? new Date(dueDate) : null;
    if (sacCode !== undefined) inst.sacCode = String(sacCode).trim();
    if (notes !== undefined) inst.notes = String(notes).trim();

    // Recompute using project GST
    project.recalcInstallmentTax(inst);

    project.calculatePaymentSummary();
    await project.save();

    return res.json({
      success: true,
      message: "Installment updated",
      data: {
        installment: inst,
        taxRate: { gstPercent: project.gstPercent },
        project: {
          projectId: project.projectId,
          totalPaid: project.totalPaid,
          remainingAmount: project.remainingAmount,
        },
      },
    });
  } catch (error) {
    console.error("editInstallment error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ================================================================
 * DELETE INSTALLMENT
 * ================================================================ */
exports.deleteInstallment = async (req, res) => {
  try {
    const { projectId, installmentId } = req.params;

    const filter = { isDeleted: { $ne: true } };
    if (mongoose.Types.ObjectId.isValid(projectId)) filter._id = projectId;
    else filter.projectId = projectId;

    const project = await Project.findOne(filter);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });

    const inst = project.installments.id(installmentId);
    if (!inst)
      return res
        .status(404)
        .json({ success: false, message: "Installment not found" });

    if (
      inst.paymentStatus === "paid" ||
      inst.paymentStatus === "pending_approval"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete a paid or pending-approval installment. Reject the payment first.",
      });
    }

    project.installments = project.installments.filter(
      (i) => String(i._id) !== String(installmentId),
    );
    project.calculatePaymentSummary();
    await project.save();

    return res.json({
      success: true,
      message: "Installment deleted",
      data: {
        projectId: project.projectId,
        totalPaid: project.totalPaid,
        remainingAmount: project.remainingAmount,
      },
    });
  } catch (error) {
    console.error("deleteInstallment error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ================================================================
 * MARK INSTALLMENT PAID
 * ================================================================ */
exports.markAsPaid = async (req, res) => {
  try {
    const { projectId, installmentId } = req.params;
    const { paymentMode = "cash", transactionId = "", paymentDate } = req.body;

    const filter = { isDeleted: { $ne: true } };
    if (mongoose.Types.ObjectId.isValid(projectId)) filter._id = projectId;
    else filter.projectId = projectId;

    const project = await Project.findOne(filter);
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });

    const inst = project.installments.id(installmentId);
    if (!inst)
      return res
        .status(404)
        .json({ success: false, message: "Installment not found" });

    if (inst.paymentStatus === "paid") {
      return res
        .status(400)
        .json({ success: false, message: "Installment already paid" });
    }

    // ⚠️ REQUIRE a pending client payment request
    if (!inst.pendingRequestId) {
      return res.status(400).json({
        success: false,
        message:
          "No pending client payment request for this installment. " +
          "Client must submit a payment first, then you can approve it.",
      });
    }

    // Load the pending request
    const PaymentRequest = require("../models/PaymentRequest");
    const paymentRequest = await PaymentRequest.findById(
      inst.pendingRequestId,
    );
    if (!paymentRequest || paymentRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "No valid pending payment request found for this installment.",
      });
    }

    // ✅ Use the CLIENT'S actual paid amount, not the full installment value
    const paid = Number(paymentRequest.paidAmount);
    const newPaidAmount = Number(
      (Number(inst.paidAmount || 0) + paid).toFixed(2),
    );
    const expected =
      inst.type === "percentage"
        ? (Number(inst.value) / 100) * Number(project.projectCost)
        : Number(inst.value);

    inst.paidAmount = newPaidAmount;
    inst.requestedAmount = paid;
    inst.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
    inst.pendingRequestId = null;

    if (newPaidAmount + 0.01 >= expected) {
      inst.paymentStatus = "paid";
      inst.status = "paid";
    } else {
      inst.paymentStatus = "partial_approved";
      inst.status = "pending";
    }

    project.calculatePaymentSummary();
    await project.save();

    // Approve the payment request
    paymentRequest.status = "approved";
    paymentRequest.reviewedBy = req.user?.id || null;
    paymentRequest.reviewedAt = new Date();
    paymentRequest.adminRemark =
      "Approved via mark-paid by admin";
    if (paymentMode) paymentRequest.paymentMode = paymentMode;
    if (transactionId) paymentRequest.transactionId = transactionId;

    // Create / accumulate invoice
    let invoice = await Invoice.findOne({
      projectId: project._id,
      installmentId: inst._id,
    });

    const gstRate = Number(project.gstPercent || 0);
    const gstAmt = Number(((paid * gstRate) / 100).toFixed(2));
    const totalForPaid = Number((paid + gstAmt).toFixed(2));

    if (!invoice) {
      invoice = new Invoice({
        projectId: project._id,
        clientId: project.clientId,
        installmentId: inst._id,
        installmentTitle: inst.title,
        sacCode: inst.sacCode || "",
        gstPercent: gstRate,
        amount: paid,
        tax: gstAmt,
        totalAmount: totalForPaid,
        status: "paid",
        dueDate: inst.dueDate || null,
        paymentDate: inst.paymentDate,
        paymentMode,
        transactionId: String(transactionId || "").trim(),
        paymentRequestId: paymentRequest._id,
      });
      await invoice.save();
    } else {
      invoice.amount = Number((Number(invoice.amount || 0) + paid).toFixed(2));
      invoice.tax = Number((Number(invoice.tax || 0) + gstAmt).toFixed(2));
      invoice.totalAmount = Number(
        (Number(invoice.totalAmount || 0) + totalForPaid).toFixed(2),
      );
      invoice.status = "paid";
      invoice.paymentDate = inst.paymentDate;
      invoice.paymentMode = paymentMode;
      invoice.transactionId = String(transactionId || "").trim();
      invoice.paymentRequestId = paymentRequest._id;
      await invoice.save();
    }

    paymentRequest.invoiceId = invoice._id;
    paymentRequest.invoiceNumber = invoice.invoiceNumber;
    await paymentRequest.save();

    inst.invoiceNumber = invoice.invoiceNumber;
    await project.save();

    return res.json({
      success: true,
      message:
        "Client payment approved. Invoice generated. Project totals updated.",
      data: {
        installment: {
          _id: inst._id,
          paymentStatus: inst.paymentStatus,
          paidAmount: inst.paidAmount,
          paymentDate: inst.paymentDate,
        },
        invoice: {
          _id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          tax: invoice.tax,
          totalAmount: invoice.totalAmount,
          status: invoice.status,
        },
        project: {
          projectId: project.projectId,
          totalPaid: project.totalPaid,
          remainingAmount: project.remainingAmount,
        },
      },
    });
  } catch (error) {
    console.error("markAsPaid error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ================================================================
 * REMINDERS
 * ================================================================ */
exports.sendReminders = async (req, res) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const nextDay = new Date(tomorrow);
    nextDay.setDate(nextDay.getDate() + 1);

    const projects = await Project.find({
      isDeleted: false,
      "installments.paymentStatus": "unpaid",
      "installments.dueDate": { $gte: tomorrow, $lt: nextDay },
    }).populate("clientId");

    let total = 0;
    for (const p of projects) {
      total += p.installments.filter(
        (i) =>
          i.paymentStatus !== "paid" &&
          i.dueDate &&
          new Date(i.dueDate).setHours(0, 0, 0, 0) === tomorrow.getTime(),
      ).length;
    }
    return res.json({
      success: true,
      message: `${total} installments due tomorrow`,
      data: { totalReminders: total, runAt: new Date().toISOString() },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUpcomingInstallments = async (req, res) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const nextDay = new Date(tomorrow);
    nextDay.setDate(nextDay.getDate() + 1);

    const projects = await Project.find({
      isDeleted: false,
      "installments.paymentStatus": "unpaid",
      "installments.dueDate": { $gte: tomorrow, $lt: nextDay },
    }).populate("clientId", "name email mobile");

    const upcoming = [];
    for (const p of projects) {
      for (const i of p.installments.filter(
        (i) =>
          i.paymentStatus !== "paid" &&
          i.dueDate &&
          new Date(i.dueDate).setHours(0, 0, 0, 0) === tomorrow.getTime(),
      )) {
        upcoming.push({
          projectId: p._id,
          projectName: p.projectName,
          clientName: p.clientId?.name || "Unknown",
          clientEmail: p.clientId?.email || "No Email",
          clientMobile: p.clientId?.mobile || "N/A",
          installmentId: i._id,
          installmentTitle: i.title,
          value: i.value,
          type: i.type,
          dueDate: i.dueDate,
          paymentStatus: i.paymentStatus,
        });
      }
    }
    return res.json({
      success: true,
      data: {
        total: upcoming.length,
        dueDate: tomorrow.toLocaleDateString(),
        installments: upcoming,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTomorrowReminders = async (req, res) => {
  try {
    // Preserves your existing date-selection behavior.
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const projects = await Project.find({
      isDeleted: false,
    }).populate("clientId", "name email mobile address");

    const reminders = [];

    for (const project of projects) {
      const totals = getProjectPaymentTotals(project);

      for (const installment of project.installments || []) {
        if (installment.paymentStatus === "paid") continue;
        if (!installment.dueDate) continue;

        const dueDate = new Date(installment.dueDate);

        if (Number.isNaN(dueDate.getTime())) continue;

        if (dueDate.toISOString().split("T")[0] !== tomorrowStr) {
          continue;
        }

        reminders.push({
          projectId: project._id,
          projectName: project.projectName,
          projectCost: totals.projectCost,

          client: {
            _id: project.clientId?._id,
            name: project.clientId?.name || "Unknown",
            email: project.clientId?.email || "No Email",
            mobile: project.clientId?.mobile || "N/A",
            address: project.clientId?.address || "",
          },

          installment: {
            _id: installment._id,
            title: installment.title,
            type: installment.type,
            value: installment.value,
            dueDate: installment.dueDate,
            paymentStatus: installment.paymentStatus,
          },
        });
      }
    }

    const clientIds = reminders
      .map((reminder) => reminder.client._id?.toString())
      .filter(Boolean);

    return res.json({
      success: true,
      data: {
        dueDate: tomorrowStr,
        totalDueTomorrow: reminders.length,
        totalClients: new Set(clientIds).size,
        reminders,
      },
    });
  } catch (error) {
    console.error("Get tomorrow reminders error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getReminderStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextDay = new Date(tomorrow);
    nextDay.setDate(nextDay.getDate() + 1);

    const [tp, dt, dtm, od] = await Promise.all([
      Project.aggregate([
        { $match: { isDeleted: false } },
        { $unwind: "$installments" },
        { $match: { "installments.paymentStatus": "unpaid" } },
        { $count: "total" },
      ]),
      Project.aggregate([
        { $match: { isDeleted: false } },
        { $unwind: "$installments" },
        {
          $match: {
            "installments.paymentStatus": "unpaid",
            "installments.dueDate": { $gte: today, $lt: tomorrow },
          },
        },
        { $count: "total" },
      ]),
      Project.aggregate([
        { $match: { isDeleted: false } },
        { $unwind: "$installments" },
        {
          $match: {
            "installments.paymentStatus": "unpaid",
            "installments.dueDate": { $gte: tomorrow, $lt: nextDay },
          },
        },
        { $count: "total" },
      ]),
      Project.aggregate([
        { $match: { isDeleted: false } },
        { $unwind: "$installments" },
        {
          $match: {
            "installments.paymentStatus": "unpaid",
            "installments.dueDate": { $lt: today },
          },
        },
        { $count: "total" },
      ]),
    ]);
    return res.json({
      success: true,
      data: {
        totalPending: tp[0]?.total || 0,
        dueToday: dt[0]?.total || 0,
        dueTomorrow: dtm[0]?.total || 0,
        overdue: od[0]?.total || 0,
        asOf: new Date().toISOString(),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.debugReminders = async (req, res) => {
  try {
    const projects = await Project.find({ isDeleted: false }).populate(
      "clientId",
      "name email",
    );
    const rows = [];
    for (const p of projects) {
      for (const i of p.installments) {
        rows.push({
          projectId: p.projectId,
          projectName: p.projectName,
          installmentId: i._id,
          title: i.title,
          dueDate: i.dueDate,
          paymentStatus: i.paymentStatus,
          paidAmount: i.paidAmount,
          requestedAmount: i.requestedAmount,
          clientName: p.clientId?.name || "No Client",
          clientEmail: p.clientId?.email || "No Email",
        });
      }
    }
    return res.json({ success: true, data: { total: rows.length, rows } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendTestReminder = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId).populate(
      "clientId",
    );
    if (!project)
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    const inst = req.body.installmentId
      ? project.installments.id(req.body.installmentId)
      : project.installments.find((i) => i.paymentStatus === "unpaid");
    if (!inst)
      return res
        .status(404)
        .json({ success: false, message: "Installment not found" });
    return res.json({
      success: true,
      message: "Test reminder logged",
      data: {
        projectName: project.projectName,
        clientEmail: project.clientId?.email || "No Email",
        installmentTitle: inst.title,
        paymentStatus: inst.paymentStatus,
        sentAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ================================================================
 * INVOICES
 * ================================================================ */
exports.getInvoices = async (req, res) => {
  try {
    const { id, projectId, clientId, status, page = 1, limit = 10 } = req.query;

    if (id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid invoice id" });
      }
      const invoice = await Invoice.findById(id)
        .populate("clientId", "name email mobile address")
        .populate("projectId", "projectName projectId category");
      if (!invoice) {
        return res
          .status(404)
          .json({ success: false, message: "Invoice not found" });
      }
      return res.json({ success: true, data: invoice });
    }

    const query = {};
    if (projectId) query.projectId = projectId;
    if (clientId) query.clientId = clientId;
    if (["generated", "sent", "paid", "overdue"].includes(status)) {
      query.status = status;
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate("clientId", "name email mobile address")
      .populate("projectId", "projectName projectId category")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const agg = await Invoice.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    return res.json({
      success: true,
      count: invoices.length,
      totalAmount: agg[0]?.total || 0,
      pagination: {
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
        total,
      },
      data: invoices,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getInvoiceStats = async (req, res) => {
  try {
    const [total, sent, paid, generated, overdue] = await Promise.all([
      Invoice.countDocuments(),
      Invoice.countDocuments({ status: "sent" }),
      Invoice.countDocuments({ status: "paid" }),
      Invoice.countDocuments({ status: "generated" }),
      Invoice.countDocuments({ status: "overdue" }),
    ]);
    const totalAmount = await Invoice.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    return res.json({
      success: true,
      data: {
        total,
        sent,
        paid,
        generated,
        overdue,
        totalAmount: totalAmount[0]?.total || 0,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createInvoices = exports.addProjectInstallment;

exports.updateInvoiceStatus = async (req, res) => {
  try {
    const invoiceId = req.params.invoiceId || req.params.id;
    const { status, paymentMode, transactionId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(invoiceId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid invoice id" });
    if (!["generated", "sent", "paid", "overdue"].includes(status))
      return res
        .status(400)
        .json({ success: false, message: "Invalid invoice status" });

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice)
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });

    invoice.status = status;
    if (status === "paid") {
      invoice.paymentDate = new Date();
      if (paymentMode !== undefined) invoice.paymentMode = paymentMode;
      if (transactionId !== undefined) invoice.transactionId = transactionId;
    }
    if (status === "sent" && !invoice.sentAt) invoice.sentAt = new Date();
    await invoice.save();

    return res.json({
      success: true,
      message: "Invoice status updated successfully",
      data: invoice,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllInvoices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
    } = req.query;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    const pageNumber = Number.isFinite(parsedPage)
      ? Math.max(1, Math.trunc(parsedPage))
      : 1;

    const limitNumber = Number.isFinite(parsedLimit)
      ? Math.min(100, Math.max(1, Math.trunc(parsedLimit)))
      : 10;

    const filter = {};

    if (["generated", "sent", "paid", "overdue"].includes(status)) {
      filter.status = status;
    }

    const invoices = await Invoice.find(filter)
      .populate("projectId")
      .populate("clientId")
      .sort({ createdAt: -1 })
      .lean();

    const searchText = String(search || "").trim().toLowerCase();

    const filtered = searchText
      ? invoices.filter((invoice) => {
          const project =
            invoice.projectId &&
            typeof invoice.projectId === "object"
              ? invoice.projectId
              : {};

          const client =
            invoice.clientId &&
            typeof invoice.clientId === "object"
              ? invoice.clientId
              : {};

          return [
            invoice.invoiceNumber,
            invoice.installmentTitle,
            project.projectId,
            project.projectName,
            client.name,
            client.email,
            client.mobile,
          ].some((value) =>
            String(value || "").toLowerCase().includes(searchText)
          );
        })
      : invoices;

    const enriched = filtered.map((invoice) => {
      const project =
        invoice.projectId && typeof invoice.projectId === "object"
          ? invoice.projectId
          : null;

      const client =
        invoice.clientId && typeof invoice.clientId === "object"
          ? invoice.clientId
          : null;

      const installment = Array.isArray(project?.installments)
        ? project.installments.find(
            (item) =>
              String(item._id) === String(invoice.installmentId)
          )
        : null;

      const totals = project
        ? getProjectPaymentTotals(project)
        : {
            projectCost: 0,
            totalPaid: 0,
            remainingAmount: 0,
          };

      const installmentAmount = Number(invoice.amount || 0);

      const gstAmount = Number(
        installment?.gstAmount ?? invoice.tax ?? 0
      );

      // Convert the populated project's display values as well.
      const displayedProject = project
        ? {
            ...project,
            projectCost: totals.projectCost,
            totalPaid: totals.totalPaid,
            remainingAmount: totals.remainingAmount,
          }
        : invoice.projectId;

      return {
        ...invoice,
        projectId: displayedProject,

        projectName: project?.projectName || "",
        projectCode: project?.projectId || "",
        projectCost: totals.projectCost,
        totalPaid: totals.totalPaid,
        remainingCost: totals.remainingAmount,

        clientName: client?.name || project?.clientName || "",
        clientMobile: client?.mobile || project?.mobileNumber || "",
        clientEmail: client?.email || project?.mailId || "",
        clientAddress: client?.address || "",

        installmentId: invoice.installmentId,
        installmentTitle:
          invoice.installmentTitle ||
          installment?.title ||
          "Project Installment",

        installmentCost: installmentAmount,
        subtotal: installmentAmount,
        gstPercent: Number(
          invoice.gstPercent ?? project?.gstPercent ?? 0
        ),
        gstAmount,
        notes: installment?.notes || "",

        totalAmount: Number(
          invoice.totalAmount ?? installmentAmount + gstAmount
        ),
      };
    });

    const total = enriched.length;
    const startIndex = (pageNumber - 1) * limitNumber;

    const paginated = enriched.slice(
      startIndex,
      startIndex + limitNumber
    );

    return res.status(200).json({
      success: true,
      message: "Invoices fetched successfully",
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
      data: paginated,
    });
  } catch (error) {
    console.error("Get all invoices error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch invoices",
      error: error.message,
    });
  }
};