import express from "express";
import { invalidateCache } from "../utils/serverCache.js";
import { cacheRoute } from "../middleware/cacheRoute.js";

const router = express.Router();

// GET /api/services - list all, alphabetical (this is a picker list, not a
// paginated table, so it always returns everything).
router.get("/services", cacheRoute("services", 300), async (req, res) => {
  try {
    const { Service } = req.app.locals.models;
    const services = await Service.findAll({ order: [["name", "ASC"]] });
    res.json({ success: true, data: services });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching services", error: error.message });
  }
});

// POST /api/services - create a new service
router.post("/services", async (req, res) => {
  try {
    const { Service } = req.app.locals.models;
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Service name is required" });
    }

    const existing = await Service.findOne({ where: { name: name.trim() } });
    if (existing) {
      return res.status(409).json({ success: false, message: "A service with this name already exists" });
    }

    const service = await Service.create({ name: name.trim(), description: description || null });
    await invalidateCache("services");
    res.status(201).json({ success: true, message: "Service created successfully", data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating service", error: error.message });
  }
});

// PUT /api/services/:id - update a service
router.put("/services/:id", async (req, res) => {
  try {
    const { Service } = req.app.locals.models;
    const service = await Service.findByPk(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    const { name, description } = req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ success: false, message: "Service name is required" });
      }
      const existing = await Service.findOne({ where: { name: name.trim() } });
      if (existing && existing.id !== service.id) {
        return res.status(409).json({ success: false, message: "A service with this name already exists" });
      }
    }

    await service.update({
      name: name !== undefined ? name.trim() : service.name,
      description: description !== undefined ? description : service.description,
    });

    await invalidateCache("services");
    res.json({ success: true, message: "Service updated successfully", data: service });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating service", error: error.message });
  }
});

// DELETE /api/services/:id
// Note: this only removes the service from the picker list going forward —
// any client that already has this service in its servicesSelected string
// keeps showing it (see the comment on the Service model). That mirrors how
// every other name-based selection in this app behaves.
router.delete("/services/:id", async (req, res) => {
  try {
    const { Service } = req.app.locals.models;
    const service = await Service.findByPk(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    await service.destroy();
    await invalidateCache("services");
    res.json({ success: true, message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting service", error: error.message });
  }
});

export default router;
