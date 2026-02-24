const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ==========================================
// ROTAS DE MATÉRIA-PRIMA (RAW MATERIALS)
// ==========================================

// Criar (Create)
app.post('/api/raw-materials', async (req, res) => {
    const { name, stock_quantity } = req.body;
    
    console.log("LOG SUPORTE - Recebido do Front:", { name, stock_quantity });

    if (!name || stock_quantity === undefined) {
        return res.status(400).json({ error: "Nome ou quantidade faltando no formulário." });
    }

    try {
        const result = await db.query(
            'INSERT INTO raw_materials (name, stock_quantity) VALUES ($1, $2) RETURNING *',
            [name, stock_quantity]
        );
        console.log("LOG SUPORTE - Salvo com sucesso:", result.rows[0]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("ERRO CRÍTICO NO BANCO DE DADOS:", err.message);
        res.status(500).json({ error: "Erro interno no servidor", details: err.message });
    }
});

// Ler (Read)
app.get('/api/raw-materials', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM raw_materials ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Atualizar (Update)
app.put('/api/raw-materials/:id', async (req, res) => {
    const { id } = req.params;
    const { name, stock_quantity } = req.body;
    try {
        const result = await db.query(
            'UPDATE raw_materials SET name = $1, stock_quantity = $2 WHERE id = $3 RETURNING *',
            [name, stock_quantity, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Erro ao atualizar material:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Apagar (Delete)
app.delete('/api/raw-materials/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM product_materials WHERE material_id = $1', [id]);
        await db.query('DELETE FROM raw_materials WHERE id = $1', [id]);
        res.json({ message: "Material successfully deleted!" });
    } catch (err) {
        console.error("Erro ao excluir material:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// ROTAS DE PRODUTOS (PRODUCTS)
// ==========================================

// Criar (Create)
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

// Ler (Read)
app.get('/api/products', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM products ORDER BY value DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Atualizar (Update)
app.put('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    const { name, value } = req.body;
    try {
        const result = await db.query(
            'UPDATE products SET name = $1, value = $2 WHERE id = $3 RETURNING *',
            [name, value, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Erro ao atualizar produto:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Apagar (Delete)
app.delete('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM product_materials WHERE product_id = $1', [id]);
        await db.query('DELETE FROM products WHERE id = $1', [id]);
        res.json({ message: "Product successfully deleted!" });
    } catch (err) {
        console.error("Erro ao excluir produto:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// ASSOCIAÇÃO & LÓGICA DE NEGÓCIO (MRP)
// ==========================================

// Vincular Material ao Produto
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

// Sugestão de Produção (A Mágica)
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

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================================

// Teste de conexão
db.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ ERRO DE CONEXÃO COM O NEON:', err.stack);
  } else {
    console.log('✅ CONEXÃO COM POSTGRES CONFIRMADA EM:', res.rows[0].now);
  }
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Erro não tratado em:', promise, 'razão:', reason);
});