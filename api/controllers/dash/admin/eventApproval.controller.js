const service = require("../../../services/dash/eventApproval.service");

exports.listDraftEvents = async (req, res) => {

  try {

    const data = await service.listDraftEvents({

      page: req.query.page || 1,
      perPage: req.query.perPage || 10,
      search: req.query.search || ""

    });

    res.json({
      success: true,
      ...data
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message
    });

  }

};


exports.getEventDetail = async (req, res) => {

  try {

    const data = await service.getEventDetail(

      req.params.id
    );

    res.json({
      success: true,
      data
    });

  } catch (err) {

    res.status(400).json({
      success: false,
      message: err.message
    });

  }

};


exports.publishEvent = async (req, res) => {

  try {

    const data = await service.publishEvent(
      req.body.eventId
    );

    res.json({
      success: true,
      data
    });

  } catch (err) {

    res.status(400).json({
      success: false,
      message: err.message
    });

  }

};