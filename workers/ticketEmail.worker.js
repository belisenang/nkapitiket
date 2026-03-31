const { Worker } = require("bullmq");

const connection = 
    require("../utils/redisBull");

const { Ticket } =
    require("../models");

const generateBulkTicketPDF =
    require("../api/services/fe/bulkTicketPdf");

const sendEmail =
    require("../utils/sendEmailSES");

const buildTicketEmail =
    require("../api/utils/ticketEmailTemplate");

const generateTicketPDF =
    require("../api/utils/ticketPdfGenerator");

const RATE_LIMIT = 1;


const worker = new Worker(

    "ticketEmail",

    async job => {

        const {

            order,

            event,

            tickets

        } = job.data;



        /*
        1 order = 1 pdf
        */

        const pdf =
            await generateBulkTicketPDF(

                order,
                event,
                tickets

            );



        const html =
            buildTicketEmail({

                name:
                    order.customer_name,

                eventName:
                    event.name,

                eventDate:
                    event.date_start,

                eventLocation:
                    event.location,

                totalTicket:
                    tickets.length

            });
        console.log(
            "start send email",
            order.customer_email
        );

        const attachments =
            await Promise.all(

                tickets.map(async t => {

                    const pdf =
                        await generateTicketPDF(
                            t,
                            event
                        );

                    return {

                        filename:
                            `${t.ticket_code}.pdf`,

                        content: pdf,

                        contentType:
                            "application/pdf"

                    };

                })

            );


        await sendEmail(

            order.customer_email,

            `🎫 Tiket Anda - ${event.name}`,

            html,

            attachments

        );


        console.log(
            "email success",
            order.customer_email
        );

        /*
        update semua tiket
        */

        await Ticket.update(

            {

                status: "sent",

                sent_at:
                    new Date()

            },

            {

                where: {

                    id:
                        tickets.map(
                            t => t.id
                        )

                }

            }

        );

    },

    {

        connection,

        concurrency: RATE_LIMIT,

        limiter: {

            max: RATE_LIMIT,

            duration: 1000

        }

    }

);


module.exports = worker;