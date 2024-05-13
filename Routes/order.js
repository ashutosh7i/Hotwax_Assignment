const router = require("express").Router();
const pool = require("../dbPool");

// checking database connection
pool.getConnection()
    .then((conn) => {
        console.log("Connected to database");
        conn.release();
    })
    .catch((err) => {
        console.error("Error connecting to database", err);
    });

// Get all orders from the database
router.get("/all", async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const [rows] = await conn.query("SELECT * FROM order_header");
        for (let i = 0; i < rows.length; i++) {
            const [orderItems] = await conn.query("SELECT * FROM order_item WHERE order_id = ?", [rows[i].order_id]);
            rows[i].order_items = orderItems;
        }
        conn.release();
        res.send(rows);
    } catch (err) {
        console.error("Error executing query", err);
        res.status(500).send("Internal server error");
    }
});

// Get a specific order from the database with its order_items
router.get("/", async (req, res) => {
    const { order_id } = req.body;
    if (!order_id) {
        return res.status(400).send("order_id is required");
    }
    try {
        const conn = await pool.getConnection();
        const [rows] = await conn.query("SELECT * FROM order_header WHERE order_id = ?", [order_id]);
        if (rows.length === 0) {
            conn.release();
            return res.status(404).send("Order not found");
        }
        const [orderItems] = await conn.query("SELECT * FROM order_item WHERE order_id = ?", [order_id]);
        rows[0].order_items = orderItems;
        conn.release();
        res.send(rows[0]);
    } catch (err) {
        console.error("Error executing query", err);
        res.status(500).send("Internal server error");
    }
});

// Add a new order to the database
// on POST /order with body of new order
// check if party_id exists in the database if yes send 405 else insert the new order
router.post("/", async (req, res) => {
    const { order_name, placed_date, approved_date, status_id, party_id, currency_uom_id, product_store_id, sales_channel_enum_id, grand_total, completed_date } = req.body;
    if (!order_name || !placed_date || !approved_date || !status_id || !party_id || !currency_uom_id || !product_store_id || !sales_channel_enum_id || !grand_total || !completed_date) {
        return res.status(400).send("All fields are required");
    }
    // checking if party_id and order_id exists in the database
    try {
        const conn = await pool.getConnection();
        const [rows] = await conn.query("SELECT * FROM party WHERE party_id = ?", [party_id]);
        if (rows.length === 0) {
            conn.release();
            return res.status(404).send("Party not found");
        }
    } catch (err) {
        console.error("Error executing query", err);
        res.status(500).send("Internal server error");
    }
    try {
        const conn = await pool.getConnection();
        const [rows] = await conn.query("SELECT * FROM order_header WHERE order_name = ?", [order_name]);
        if (rows.length > 0) {
            conn.release();
            return res.status(405).send("Order already exists");
        }
        // generate a new order_id
        const order_id = "Order" + Math.floor(Math.random() * 10000);
        await conn.query("INSERT INTO order_header ( order_id, order_name, placed_date, approved_date, status_id, party_id, currency_uom_id, product_store_id, sales_channel_enum_id, grand_total, completed_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [order_id, order_name, placed_date, approved_date, status_id, party_id, currency_uom_id, product_store_id, sales_channel_enum_id, grand_total, completed_date]);
        conn.release();
        res.send(`Order added successfully${order_id}`);
    } catch (err) {
        console.error("Error executing query", err);
        res.status(500).send("Internal server error");
    }
});


// update order name to an existing order with order_id
// on PATCH /order with body order id and new order name
// first check if the order_id exists in the database if not send 404 else update the order name
router.patch("/", async (req, res) => {
    const { order_id, order_name } = req.body;
    if (!order_id) {
        return res.status(400).send("Order id is required");
    }
    try {
        const conn = await pool.getConnection();
        const [rows] = await conn.query("SELECT * FROM order_header WHERE order_id = ?", [order_id]);
        if (rows.length === 0) {
            conn.release();
            return res.status(404).send("Order not found");
        }
        await conn.query("UPDATE order_header SET order_name = ? WHERE order_id = ?", [order_name, order_id]);
        conn.release();
        res.send("Order name updated successfully");
    } catch (err) {
        console.error("Error executing query", err);
        res.status(500).send("Internal server error");
    }
});

// add order_item to an existing order with order_id
// on POST /addOrderItems{order_id} with body of new order item
// {
//   "order_item_seq_id": 2,
//   "product_id": PD10002,
//   "item_description": "Product B",
//   "quantity": 1,
//   "unit_amount": 30.00,
//   "item_type_enum_id": "DIGITAL"
// }
// check if product_id exists in the database if not send 404 else insert the new order item
router.post("/addOrderItems", async (req, res) => {
    const { order_id, product_id, item_description, quantity, unit_amount, item_type_enum_id } = req.body;
    if (!order_id || !product_id || !item_description || !quantity || !unit_amount || !item_type_enum_id) {
        return res.status(400).send("All fields are required");
    }
    // checking if product_id exists in the database
    try {
        const conn = await pool.getConnection();
        const [rows] = await conn.query("SELECT * FROM product WHERE product_id = ?", [product_id]);
        if (rows.length === 0) {
            conn.release();
            return res.status(404).send("Product not found");
        }
    } catch (err) {
        console.error("Error executing query", err);
        res.status(500).send("Internal server error");
    }
    try {
        const conn = await pool.getConnection();
        const [rows] = await conn.query("SELECT * FROM order_header WHERE order_id = ?", [order_id]);
        if (rows.length === 0) {
            conn.release();
            return res.status(404).send("Order not found");
        }
        await conn.query("INSERT INTO order_item (order_id, product_id, item_description, quantity, unit_amount, item_type_enum_id) VALUES (?, ?, ?, ?, ?, ?)", [order_id, product_id, item_description, quantity, unit_amount, item_type_enum_id]);
        conn.release();
        res.send("Order item added successfully");
    } catch (err) {
        console.error("Error executing query", err);
        res.status(500).send("Internal server error");
    }
});

module.exports = router;