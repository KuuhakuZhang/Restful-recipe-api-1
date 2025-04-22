
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000;
app.use(bodyParser.json());

// データベース初期化
const dbFile = './recipes.db';
const exists = fs.existsSync(dbFile);
const db = new sqlite3.Database(dbFile);

if (!exists) {
    const initSql = fs.readFileSync('./sql/create.sql', 'utf-8');
    db.exec(initSql);
}

// POST /recipes - 新規作成
app.post('/recipes', (req, res) => {
    const { title, making_time, serves, ingredients, cost } = req.body;
    if (!title || !making_time || !serves || !ingredients || !cost) {
        return res.status(200).json({
            message: "Recipe creation failed!",
            required: "title, making_time, serves, ingredients, cost"
        });
    }
    db.run(
        `INSERT INTO recipes (title, making_time, serves, ingredients, cost, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [title, making_time, serves, ingredients, cost],
        function (err) {
            if (err) return res.status(500).json({ message: "Internal error" });
            db.get(`SELECT * FROM recipes WHERE id = ?`, [this.lastID], (err, row) => {
                res.status(200).json({ message: "Recipe successfully created!", recipe: [row] });
            });
        }
    );
});

// GET /recipes - 全取得
app.get('/recipes', (req, res) => {
    db.all(`SELECT * FROM recipes`, [], (err, rows) => {
        res.status(200).json({ recipes: rows });
    });
});

// GET /recipes/:id - 特定取得
app.get('/recipes/:id', (req, res) => {
    db.get(`SELECT * FROM recipes WHERE id = ?`, [req.params.id], (err, row) => {
        if (!row) return res.status(200).json({ message: "No Recipe found" });
        res.status(200).json({ message: "Recipe details by id", recipe: [row] });
    });
});

// PATCH /recipes/:id - 更新
app.patch('/recipes/:id', (req, res) => {
    const { title, making_time, serves, ingredients, cost } = req.body;
    if (!title || !making_time || !serves || !ingredients || !cost) {
        return res.status(200).json({
            message: "Recipe update failed!",
            required: "title, making_time, serves, ingredients, cost"
        });
    }
    db.run(
        `UPDATE recipes SET title = ?, making_time = ?, serves = ?, ingredients = ?, cost = ?, updated_at = datetime('now') WHERE id = ?`,
        [title, making_time, serves, ingredients, cost, req.params.id],
        function (err) {
            if (this.changes === 0) return res.status(200).json({ message: "No Recipe found" });
            db.get(`SELECT * FROM recipes WHERE id = ?`, [req.params.id], (err, row) => {
                res.status(200).json({ message: "Recipe successfully updated!", recipe: [row] });
            });
        }
    );
});

// DELETE /recipes/:id - 削除
app.delete('/recipes/:id', (req, res) => {
    db.get(`SELECT * FROM recipes WHERE id = ?`, [req.params.id], (err, row) => {
        if (!row) return res.status(200).json({ message: "No Recipe found" });
        db.run(`DELETE FROM recipes WHERE id = ?`, [req.params.id], function () {
            res.status(200).json({ message: "Recipe successfully removed!" });
        });
    });
});

// それ以外のパスは404
app.use((req, res) => {
    res.status(404).json({ message: "Not Found" });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
