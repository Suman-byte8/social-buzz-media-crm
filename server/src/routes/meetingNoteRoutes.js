import express from "express";
import { Op } from "sequelize";

const router = express.Router();

router.post("/meeting-notes", async (req, res) => {
  try {
    const { MeetingNote, Client } = req.app.locals.models;
    const {
      title,
      description,
      meetingDate,
      meetingType,
      attendees,
      actionItems,
      clientId,
      createdBy,
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    const meetingNote = await MeetingNote.create({
      title,
      description: description || null,
      meetingDate: meetingDate || null,
      meetingType: meetingType || "other",
      attendees: attendees || null,
      actionItems: actionItems || null,
      clientId: clientId ? parseInt(clientId) : null,
      createdBy: createdBy || null,
    });

    res.status(201).json({
      success: true,
      message: "Meeting note created successfully",
      data: meetingNote,
    });
  } catch (error) {
    console.error("Error creating meeting note:", error);
    res.status(500).json({
      success: false,
      message: "Error creating meeting note",
      error: error.message,
    });
  }
});

router.get("/meeting-notes", async (req, res) => {
  try {
    const { MeetingNote, Client } = req.app.locals.models;
    const { clientId, search = "", meetingType } = req.query;

    const where = {};

    if (clientId && clientId !== "all") {
      where.clientId = parseInt(clientId);
    }

    if (meetingType && meetingType !== "all") {
      where.meetingType = meetingType;
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const meetingNotes = await MeetingNote.findAll({
      where,
      order: [["meetingDate", "DESC"]],
    });

    const clientIds = meetingNotes.map((n) => n.clientId).filter(Boolean);
    const clients = await Client.findAll({
      where: { id: { [Op.in]: clientIds } },
      attributes: ["id", "name"],
    });

    const enrichedNotes = meetingNotes.map((note) => {
      const client = clients.find((c) => c.id === note.clientId);
      return {
        ...note.toJSON(),
        clientName: client ? client.name : null,
      };
    });

    res.json({ success: true, data: enrichedNotes });
  } catch (error) {
    console.error("Error fetching meeting notes:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching meeting notes",
      error: error.message,
    });
  }
});

router.get("/meeting-notes/:id", async (req, res) => {
  try {
    const { MeetingNote, Client } = req.app.locals.models;
    const meetingNote = await MeetingNote.findByPk(req.params.id);

    if (!meetingNote) {
      return res.status(404).json({ success: false, message: "Meeting note not found" });
    }

    const noteData = meetingNote.toJSON();
    let client = null;
    if (noteData.clientId) {
      client = await Client.findByPk(noteData.clientId, {
        attributes: ["id", "name"],
      });
    }

    res.json({
      success: true,
      data: {
        ...noteData,
        client,
      },
    });
  } catch (error) {
    console.error("Error fetching meeting note:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching meeting note",
      error: error.message,
    });
  }
});

router.put("/meeting-notes/:id", async (req, res) => {
  try {
    const { MeetingNote } = req.app.locals.models;
    const meetingNote = await MeetingNote.findByPk(req.params.id);

    if (!meetingNote) {
      return res.status(404).json({ success: false, message: "Meeting note not found" });
    }

    const { title, description, meetingDate, meetingType, attendees, actionItems, clientId } = req.body;

    const updateData = {
      title: title ?? meetingNote.title,
      description: description !== undefined ? description : meetingNote.description,
      meetingDate: meetingDate !== undefined ? meetingDate : meetingNote.meetingDate,
      meetingType: meetingType ?? meetingNote.meetingType,
      attendees: attendees !== undefined ? attendees : meetingNote.attendees,
      actionItems: actionItems !== undefined ? actionItems : meetingNote.actionItems,
      clientId: clientId !== undefined ? parseInt(clientId) : meetingNote.clientId,
    };

    await meetingNote.update(updateData);

    res.json({
      success: true,
      message: "Meeting note updated successfully",
      data: meetingNote,
    });
  } catch (error) {
    console.error("Error updating meeting note:", error);
    res.status(500).json({
      success: false,
      message: "Error updating meeting note",
      error: error.message,
    });
  }
});

router.delete("/meeting-notes/:id", async (req, res) => {
  try {
    const { MeetingNote } = req.app.locals.models;
    const meetingNote = await MeetingNote.findByPk(req.params.id);

    if (!meetingNote) {
      return res.status(404).json({ success: false, message: "Meeting note not found" });
    }

    await meetingNote.destroy();
    res.json({ success: true, message: "Meeting note deleted successfully" });
  } catch (error) {
    console.error("Error deleting meeting note:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting meeting note",
      error: error.message,
    });
  }
});

export default router;
