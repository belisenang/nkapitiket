// controllers/dash/order.controller.js
const service = require("../../services/dash/order.service");
const { Parser } = require("json2csv");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const moment = require("moment");
const { Creator } = require("../../../models");

module.exports = {

  async pagination(req, res) {
    
    try {
      const creator_id = req.user.creator_id;

      const event_id =
        req.query.event_id && req.query.event_id !== "ALL"
          ? req.query.event_id
          : null;

      const payment_method =
        req.query.payment_method && req.query.payment_method !== "ALL"
          ? req.query.payment_method
          : null;

      const start_date =
        req.query.start_date && req.query.start_date !== "null"
          ? req.query.start_date
          : null;

      const end_date =
        req.query.end_date && req.query.end_date !== "null"
          ? req.query.end_date
          : null;

      const result = await service.getPagination({
        page: req.query.page,
        perPage: req.query.perPage,
        search: req.query.search,
        status: req.query.status,
        creator_id,
        event_id,
        payment_method,
        start_date,
        end_date,
      });

      return res.json({
        success: true,
        message: "Orders retrieved",
        data: result.rows,
        summary: result.summary,
        meta: {
          page: Number(result.page),
          perPage: Number(result.perPage),
          totalItems: result.count,
          totalPages: result.totalPages,
        },
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  async detail(req, res) {
    try {
      const creator_id = req.user.creator_id;
      const order = await service.getDetail(req.params.id, creator_id);

      res.json({
        success: true,
        message: "Order detail",
        data: order,
      });
    } catch (err) {
      res.status(404).json({ success: false, message: err.message });
    }
  },

  async exportCSV(req, res) {
    try {

      const creator_id = req.user.creator_id;

      const data =
        await service.getExportData({

          search: req.query.search,

          status: req.query.status,

          creator_id,

          event_id:
            req.query.event_id &&
              req.query.event_id !== "ALL"
              ? req.query.event_id
              : null,


          payment_method:
            req.query.payment_method &&
              req.query.payment_method !== "ALL"
              ? req.query.payment_method
              : null,

          start_date:
            req.query.start_date || null,

          end_date:
            req.query.end_date || null,

        });


      const fields = [

        "invoice_no",

        "event_name",

        "ticket_type",

        "quantity",

        "ticket_price",

        "admin_fee_amount",

        "tax_amount",

        "buyer_pay_amount",

        "total_order",

        "customer_name",

        "customer_email",

        "payment_method",

        "status",

        "paid_at",

        "created_at"

      ];


      const parser =
        new Parser({
          fields
        });


      const csv =
        parser.parse(
          data || []
        );


      res.setHeader(
        "Content-Type",
        "text/csv"
      );


      res.setHeader(
        "Content-Disposition",
        "attachment; filename=orders.csv"
      );


      return res.send(csv);

    } catch (err) {

      console.error("CSV ERROR:", err);

      return res
        .status(500)
        .json({
          success: false,
          message: err.message
        });

    }
  },

  async exportXLSX(req, res) {
    try {
      const creator_id = req.user.creator_id;

      const data = await service.getExportData({
        search: req.query.search,
        status: req.query.status,
        creator_id,

        event_id:
          req.query.event_id &&
            req.query.event_id !== "ALL"
            ? req.query.event_id
            : null,


        payment_method:
          req.query.payment_method &&
            req.query.payment_method !== "ALL"
            ? req.query.payment_method
            : null,

        start_date: req.query.start_date || null,
        end_date: req.query.end_date || null,
      });

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Orders");

      sheet.columns = [
        { header: "Invoice", key: "invoice_no", width: 22 },
        { header: "Event", key: "event_name", width: 22 },
        { header: "Ticket Type", key: "ticket_type", width: 18 },
        { header: "Qty", key: "quantity", width: 8 },
        { header: "Ticket Price", key: "ticket_price", width: 15 },
        { header: "Admin Fee", key: "admin_fee_amount", width: 15 },
        { header: "Tax", key: "tax_amount", width: 15 },
        { header: "Total Item", key: "buyer_pay_amount", width: 20 },
        { header: "Total Order", key: "total_order", width: 20 },
        { header: "Customer", key: "customer_name", width: 25 },
        { header: "Status", key: "status", width: 10 },
        { header: "Payment", key: "payment_method", width: 15 },
        { header: "Paid At", key: "paid_at", width: 20 },
        { header: "Date", key: "created_at", width: 20 },
      ];

      data.forEach(row => sheet.addRow(row));

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=orders.xlsx");

      await workbook.xlsx.write(res);
      res.end();

    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: "Failed export XLSX" });
    }
  },

  async exportPDF(req, res) {
    try {
      const creator_id = req.user.creator_id;

      const data = await service.getExportData({
        search: req.query.search,
        status: req.query.status,
        creator_id,

        event_id:
          req.query.event_id &&
            req.query.event_id !== "ALL"
            ? req.query.event_id
            : null,


        payment_method:
          req.query.payment_method &&
            req.query.payment_method !== "ALL"
            ? req.query.payment_method
            : null,
        start_date: req.query.start_date || null,
        end_date: req.query.end_date || null,
      });

      const mediabase = process.env.MEDIA_URL_FRONTEND;
      const creator = await Creator.findByPk(creator_id);
      const logoUrl = creator?.image ? mediabase + creator.image : null;

      const doc = new PDFDocument({ size: "A4", margin: 40 });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=orders.pdf");

      doc.pipe(res);

      // Header
      if (logoUrl) {
        try { doc.image(logoUrl, 40, 30, { width: 70 }); } catch { }
      }

      doc.fontSize(20).text("Orders Report", 130, 40);
      doc.fontSize(10).fillColor("#555").text(`Generated: ${moment().format("DD MMM YYYY HH:mm")}`, 130, 62);
      doc.moveDown(3);

      let y = 130;

      data.forEach((row) => {
        doc.fontSize(10).fillColor("#000");

        doc.text(row.invoice_no, 40, y);
        doc.text(row.event_name, 150, y);
        doc.text(row.ticket_type, 280, y);
        doc.text(`Rp ${row.buyer_pay_amount.toLocaleString()}`, 380, y);
        doc.text(moment(row.created_at).format("DD MMM YYYY"), 470, y);

        y += 25;

        if (y > 750) {
          doc.addPage();
          y = 60;
        }
      });

      doc.end();

    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: "Failed export PDF" });
    }
  },

  async resendTicket(req, res) {
    try {
      const { id } = req.params;

      const order = await Order.findOne({
        where: { id },
        include: [
          {
            model: OrderItem,
            as: "items",
            include: [{ model: Ticket, as: "tickets" }]
          },
          { model: CustomerUser, as: "customer" }
        ]
      });

      if (!order) return res.error("Order not found");
      if (order.status !== "paid") return res.error("Order not paid");

      await sendTicketEmail(order);

      return res.success("Ticket resend success");
    } catch (err) {
      return res.error(err.message);
    }
  }

};