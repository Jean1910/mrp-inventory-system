const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// --- RAW MATERIALS ROUTES (RF002) ---
app.post('/api/raw-materials', async (req, res) => {
    const { name, stock_quantity } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO raw_materials (name, stock_quantity) VALUES ($1, $2) RETURNING *',
            [name, stock_quantity]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/raw-materials', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM raw_materials ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PRODUCTS ROUTES (RF001) ---
app.post('/api/products', async (req, res) => {
    const { name, value } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO products (name, value) VALUES ($1, $2) RETURNING *',
            [name, value]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM products ORDER BY value DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- ASSOCIATION ROUTE (RF003) ---
app.post('/api/products/:id/materials', async (req, res) => {
    const { id } = req.params;
    const { material_id, quantity_needed } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO product_materials (product_id, material_id, quantity_needed) VALUES ($1, $2, $3) RETURNING *',
            [id, material_id, quantity_needed]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PRODUCTION SUGGESTION LOGIC (RF004) ---
app.get('/api/production-suggestion', async (req, res) => {
    try {
        const productsRes = await db.query('SELECT * FROM products ORDER BY value DESC');
        const materialsRes = await db.query('SELECT * FROM raw_materials');
        
        let inventory = {};
        materialsRes.rows.forEach(m => inventory[m.id] = parseFloat(m.stock_quantity));

        let suggestion = [];
        let totalRevenue = 0;

        for (let product of productsRes.rows) {
            const recipeRes = await db.query(
                'SELECT material_id, quantity_needed FROM product_materials WHERE product_id = $1',
                [product.id]
            );
            
            if (recipeRes.rows.length === 0) continue;

            let possibleToMake = Infinity;
            recipeRes.rows.forEach(item => {
                const available = inventory[item.material_id] || 0;
                const canMake = Math.floor(available / parseFloat(item.quantity_needed));
                possibleToMake = Math.min(possibleToMake, canMake);
            });

            if (possibleToMake > 0 && possibleToMake !== Infinity) {
                recipeRes.rows.forEach(item => {
                    inventory[item.material_id] -= (possibleToMake * parseFloat(item.quantity_needed));
                });
                
                suggestion.push({
                    name: product.name,
                    quantity: possibleToMake,
                    total_value: possibleToMake * parseFloat(product.value)
                });
                totalRevenue += (possibleToMake * parseFloat(product.value));
            }
        }
        res.json({ suggestion, total_revenue: totalRevenue });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));